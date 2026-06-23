# API и модель данных

Технические детали к дизайну из `DIAGRAM.md`: конкретные эндпоинты, схемы
запросов/ответов и DDL таблиц. Это иллюстрация контракта, не финальная
реализация — детали (пагинация, версионирование ошибок) можно уточнять в
процессе.

Все эндпоинты — за заголовком `X-Internal-Api-Key: <shared secret>`,
вызывающая сторона — `pr-app`/`invoice-app`/ERP-адаптер, не конечный
пользователь напрямую.

## Reference module

### Suppliers

```
GET    /api/v1/suppliers?search=&is_active=true&limit=20&offset=0
GET    /api/v1/suppliers/{id}
POST   /api/v1/suppliers
PATCH  /api/v1/suppliers/{id}
```

```python
class SupplierCreate(BaseModel):
    legal_name: str
    tax_id: str | None = None
    bank_account: str | None = None
    bank_bik: str | None = None
    payment_terms_days: int = 30
    contact_email: EmailStr | None = None

class SupplierOut(SupplierCreate):
    id: int
    is_active: bool
    created_at: datetime
```

```json
// GET /api/v1/suppliers?search=ромашка -> 200
{
  "items": [
    {
      "id": 17,
      "legal_name": "ООО Ромашка",
      "tax_id": "7701234567",
      "bank_account": "40702810...",
      "bank_bik": "044525225",
      "payment_terms_days": 30,
      "contact_email": "finance@romashka.ru",
      "is_active": true,
      "created_at": "2026-03-01T10:00:00Z"
    }
  ],
  "total": 1
}
```

### Teams & budgets

```
GET    /api/v1/teams
POST   /api/v1/teams
POST   /api/v1/teams/{id}/members
DELETE /api/v1/teams/{id}/members/{user_id}
GET    /api/v1/teams/{id}/budget?period=2026-Q3
POST   /api/v1/budgets
POST   /api/v1/budgets/{id}/reservations
DELETE /api/v1/budgets/{id}/reservations/{reference}
```

```python
class BudgetReservationCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    reference: str          # код PR, например "PR-42"

class BudgetReservationOut(BaseModel):
    id: int
    budget_id: int
    reference: str
    amount: Decimal
    status: Literal["active", "released"]
    created_at: datetime

class TeamBudgetOut(BaseModel):
    team_id: int
    period: str
    currency: str
    amount_allocated: Decimal
    amount_reserved: Decimal     # SUM(active reservations)
    amount_remaining: Decimal    # allocated - reserved
```

```json
// POST /api/v1/budgets/3/reservations
// request
{ "amount": "150000.00", "reference": "PR-42" }

// 201 Created
{
  "id": 91,
  "budget_id": 3,
  "reference": "PR-42",
  "amount": "150000.00",
  "status": "active",
  "created_at": "2026-06-23T09:14:00Z"
}

// 409 Conflict — бюджета не хватает
{ "detail": "insufficient_budget", "remaining": "80000.00" }

// повтор того же reference (retry после таймаута) — идемпотентно
// 200 OK, возвращается уже существующая резервация, без повторного списания
```

## Hub module

```
GET  /api/v1/overview?team_id=&status=&needs_review=true&limit=20&offset=0
GET  /api/v1/overview/{pr_code}
POST /api/v1/erp/webhook          # вызывается ERP-адаптером
```

```python
class OverviewRow(BaseModel):
    pr_code: str
    pr_status: str                 # см. state-диаграмму в DIAGRAM.md
    team_name: str
    supplier_name: str | None
    estimated_amount: Decimal | None
    po_number: str | None
    po_amount: Decimal | None
    invoice_number: str | None
    invoice_sum: Decimal | None
    invoice_sum_paid: Decimal | None
    reconciliation_status: Literal["ok", "amount_mismatch", "needs_review"]
    updated_at: datetime

class ErpPoWebhook(BaseModel):
    po_number: str
    pr_reference: str              # код PR, который указал закупщик в ERP
    amount: Decimal
    currency: str
    created_at: datetime
```

```json
// GET /api/v1/overview/PR-42 -> 200
{
  "pr_code": "PR-42",
  "pr_status": "Invoiced",
  "team_name": "Закупки склада",
  "supplier_name": "ООО Ромашка",
  "estimated_amount": "150000.00",
  "po_number": "PO-2026-0098",
  "po_amount": "150000.00",
  "invoice_number": "INV-551",
  "invoice_sum": "152000.00",
  "invoice_sum_paid": "0.00",
  "reconciliation_status": "amount_mismatch",
  "updated_at": "2026-06-20T15:02:00Z"
}
```

## DDL: schema `reference`

```sql
CREATE SCHEMA reference;

CREATE TABLE reference.supplier (
    id                  SERIAL PRIMARY KEY,
    legal_name          TEXT NOT NULL UNIQUE,
    tax_id              TEXT,
    bank_account        TEXT,
    bank_bik            TEXT,
    payment_terms_days  INT NOT NULL DEFAULT 30,
    contact_email       TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reference.team (
    id                SERIAL PRIMARY KEY,
    name              TEXT NOT NULL UNIQUE,
    cost_center_code  TEXT
);

CREATE TABLE reference.team_member (
    team_id  INT NOT NULL REFERENCES reference.team(id),
    user_id  INT NOT NULL,            -- НЕ FK на pr-app.users — другая БД
    PRIMARY KEY (team_id, user_id)
);

CREATE TABLE reference.budget (
    id                SERIAL PRIMARY KEY,
    team_id           INT NOT NULL REFERENCES reference.team(id),
    period            TEXT NOT NULL,         -- "2026-Q3"
    amount_allocated  NUMERIC(14,2) NOT NULL,
    currency          TEXT NOT NULL DEFAULT 'RUB',
    UNIQUE (team_id, period)
);

CREATE TABLE reference.budget_reservation (
    id          SERIAL PRIMARY KEY,
    budget_id   INT NOT NULL REFERENCES reference.budget(id),
    reference   TEXT NOT NULL,                -- код PR
    amount      NUMERIC(14,2) NOT NULL,
    status      TEXT NOT NULL DEFAULT 'active', -- active | released
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (budget_id, reference)               -- идемпотентность
);
```

## DDL: schema `hub`

```sql
CREATE SCHEMA hub;

CREATE TABLE hub.procurement_overview (
    pr_code                TEXT PRIMARY KEY,
    pr_status              TEXT NOT NULL,
    team_id                 INT,
    supplier_id             INT,
    estimated_amount        NUMERIC(14,2),
    po_number               TEXT,
    po_amount               NUMERIC(14,2),
    invoice_number          TEXT,
    invoice_sum             NUMERIC(14,2),
    invoice_sum_paid        NUMERIC(14,2),
    reconciliation_status   TEXT NOT NULL DEFAULT 'ok',  -- ok | amount_mismatch | needs_review
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- сырой лог входящих событий — для отладки матчинга и как побочный audit trail
CREATE TABLE hub.raw_event_log (
    id          BIGSERIAL PRIMARY KEY,
    source      TEXT NOT NULL,     -- 'pr-app' | 'invoice-app' | 'erp'
    payload     JSONB NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
