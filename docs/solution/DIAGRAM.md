# Диаграммы решения

Все диаграммы — в Mermaid, GitHub рендерит их прямо в превью markdown, без
внешних инструментов. Каждая диаграмма сопровождается пояснением: что на ней,
зачем она нужна и почему сделана именно так.

## 1. Контекст: кто с кем взаимодействует

```mermaid
graph TD
    Employee([Сотрудник]) --> PRApp[pr-app]
    Finance([Финансист]) --> PRApp
    Finance --> InvoiceApp[invoice-app]
    Procurement([Закупщик]) --> ERP[ERP]

    PRApp -- "sync: проверка/резерв бюджета,\nсправочник поставщиков" --> Platform[procurement-platform]
    InvoiceApp -- "sync: справочник поставщиков" --> Platform
    PRApp -. "async v1: polling /purchase-requests" .-> Platform
    InvoiceApp -. "async v1: polling /invoices" .-> Platform
    ERP -. "async: webhook PO.created" .-> Platform
    Finance -- "GET /overview" --> Platform
```

**Что показано.** Три категории связей: (1) сплошные — синхронные вызовы,
где ответ нужен прямо сейчас (бюджет, справочник); (2) пунктирные — асинхронный
поток данных о статусе (poll или webhook); (3) `procurement-platform` —
новый узел, владеющий межсистемными сущностями.

**Почему не "труба между pr-app и invoice-app".** pr-app и invoice-app
сегодня не общаются друг с другом вообще, и в новой схеме тоже не должны —
у них нет общих данных, которые нужно "передавать" друг другу напрямую. Оба
независимо обращаются к `procurement-platform` как клиенты — это hub-and-spoke,
а не релей.

## 2. Компоненты внутри `procurement-platform`

```mermaid
graph TD
    subgraph PP["procurement-platform — один процесс"]
        RefRouter["Reference router\n/suppliers /teams /budgets"] --> RefService[Reference service]
        RefService --> RefDB[("schema: reference")]

        HubRouter["Hub router\n/overview"] --> Projection[Projection + matcher]
        Source["EventSource — интерфейс"] --> Projection
        Polling["PollingSource (v1)"] -. implements .-> Source
        KafkaSrc["KafkaSource (v2, не реализовано)"] -. implements .-> Source
        ErpAdapter[ERP adapter] --> Projection
        Projection --> HubDB[("schema: hub")]
    end
```

**Что показано.** Внутренняя граница между `reference` и `hub` — по схемам
БД, не только по папкам в коде. `EventSource` — точка расширения (Strategy
pattern): `Projection` работает с любым источником событий одинаково, не
зная, поллинг это или Kafka. Это и есть механизм, который снимает дилемму
"Kafka сейчас или никогда" — переключение между `PollingSource` и
`KafkaSource` это замена одного класса в DI-конфиге, без переписывания
бизнес-логики сверки.

**Почему `KafkaSource` показан, но помечен "не реализовано".** Чтобы явно
зафиксировать: архитектура к этому готова, но мы не платим цену
инфраструктуры за объём, которого нет — см. `README.md`, раздел про scope cuts.

## 3. Жизненный цикл закупки (вид Hub — синтетическая проекция)

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> SentForApproval: submit (pr-app)
    SentForApproval --> Approved: finance approves (pr-app)
    SentForApproval --> Rejected: finance rejects (pr-app)
    Approved --> POIssued: закупщик создаёт PO в ERP
    POIssued --> Invoiced: invoice-app: счёт зарегистрирован
    Invoiced --> PartiallyPaid: invoice-app: invoice_sum_paid < invoice_sum
    Invoiced --> Paid: invoice-app: invoice_sum_paid == invoice_sum
    PartiallyPaid --> Paid: финальная оплата
    Draft --> Cancelled: сотрудник отменяет
    Rejected --> [*]
    Cancelled --> [*]
    Paid --> [*]
```

**Что показано.** Это состояние не существует целиком ни в одной из трёх
систем — оно собирается Hub'ом из кусочков: `pr-app` знает про
`Draft → Approved/Rejected`, ERP знает про `POIssued`, `invoice-app` знает
про `Invoiced → Paid`. Именно отсутствие этой сводной картины и есть боль
№1 из README ("кто-то экспортирует в Excel и объединяет вручную").

**Почему это не настоящий FSM с явными переходами, а "наблюдаемая"
проекция.** Hub не управляет переходами — он их распознаёт постфактум по
данным, пришедшим от трёх систем (через polling-diff или webhook). Если
`pr-app` когда-нибудь введёт промежуточный статус, которого Hub не ожидает,
эта строка просто попадёт в "needs review" в дашборде — деградация
контролируемая, не падение.

## 4. Последовательность: отправка PR с резервированием бюджета

```mermaid
sequenceDiagram
    actor Employee as Сотрудник
    participant PR as pr-app
    participant Ref as procurement-platform: Reference

    Employee->>PR: submit PR (team_id, estimated_amount)
    PR->>Ref: POST /budgets/{id}/reservations<br/>{amount, reference: "PR-42"}
    alt бюджет доступен
        Ref-->>PR: 201 reserved
        PR-->>Employee: PR отправлен на согласование
    else бюджет превышен
        Ref-->>PR: 409 insufficient budget
        PR-->>Employee: предупреждение, отправка возможна с подтверждением
    else Reference недоступен — fail-open
        Ref--xPR: timeout / 5xx
        PR-->>Employee: PR отправлен (бюджет не проверен — будет сверен позже)
    end
```

**Почему резервирование, а не просто проверка.** Проверка-и-списание одной
операцией (`SELECT ... FOR UPDATE` внутри `POST /reservations`) убирает race
condition: два сотрудника одновременно проверяют "бюджет есть", оба создают
PR — без атомарного резервирования бюджет уйдёт в минус.

**Почему ветка fail-open, а не блокировка.** Описано в `README.md` —
доступность процесса согласования PR не должна зависеть от аплейма нового
вспомогательного сервиса жёстче, чем сейчас.

## 5. Последовательность: создание инвойса со справочником поставщиков

```mermaid
sequenceDiagram
    actor Finance as Финансист
    participant Inv as invoice-app
    participant Ref as procurement-platform: Reference

    Finance->>Inv: открыть форму создания инвойса
    Inv->>Ref: GET /suppliers?search=
    Ref-->>Inv: список поставщиков (id, legal_name)
    Finance->>Inv: выбрать supplier_id, ввести PR-код вручную, сумму
    Inv->>Inv: сохранить invoice (supplier_id вместо free-text)
```

**Что меняется относительно текущего кода.** Единственное затрагиваемое
поле в `invoice-app` — поставщик: было свободное текстовое поле, становится
выбор из дропдауна, заполненного из Reference. Поле `purchaseRequestNumber`
остаётся как сейчас (free-text) — описано в README, почему это
сознательный compromise, а не недосмотр.

## 6. Последовательность: ERP создаёт PO, Hub сверяет с инвойсом

```mermaid
sequenceDiagram
    participant ERP
    participant Hub as procurement-platform: Hub
    participant Finance as Финансист

    ERP->>Hub: webhook PO.created<br/>{po_number, pr_reference, amount}
    Hub->>Hub: найти PR с кодом pr_reference в своей проекции
    alt найден
        Hub->>Hub: обновить проекцию: статус -> POIssued
    else не найден
        Hub->>Hub: пометить "needs review"
    end
    Note over Hub: позже invoice-app сообщает о выставленном счёте
    Hub->>Hub: сравнить amount (PO) vs invoice_sum (Invoice)
    alt совпадает
        Hub->>Hub: статус -> Invoiced, без расхождений
    else не совпадает
        Hub->>Hub: статус -> Invoiced, флаг "amount mismatch"
    end
    Finance->>Hub: GET /overview
    Hub-->>Finance: сводная таблица PR/PO/Invoice + расхождения
```

**Это и есть закрытие боли №5** ("ни один из существующих инструментов не
имеет понятия о заказе на покупку") — PO как сущность впервые появляется
именно здесь, и расхождения между заказанным и выставленным к оплате
становятся видимыми автоматически, а не находятся постфактум бухгалтером.

## 7. Модель данных Reference-модуля

```mermaid
erDiagram
    TEAM ||--o{ TEAM_MEMBER : has
    TEAM ||--o{ BUDGET : allocated
    BUDGET ||--o{ BUDGET_RESERVATION : reserves
    SUPPLIER {
        int id PK
        string legal_name
        string tax_id
        string bank_account
        int payment_terms_days
        bool is_active
    }
    TEAM {
        int id PK
        string name
        string cost_center_code
    }
    TEAM_MEMBER {
        int team_id FK
        int user_id
    }
    BUDGET {
        int id PK
        int team_id FK
        string period
        decimal amount_allocated
        string currency
    }
    BUDGET_RESERVATION {
        int id PK
        int budget_id FK
        string reference
        decimal amount
        string status
    }
```

**Почему `SUPPLIER` не связан стрелками с остальными.** Это независимый
справочник, используемый по `id` снаружи (`pr-app`, `invoice-app`, `hub`) —
он не должен знать о бюджетах и командах, иначе теряется смысл разделения.

**Почему `user_id` в `TEAM_MEMBER`, а не FK на `users`.** `procurement-platform`
не должен знать схему чужой БД — ровно та граница, которую мы создаём,
разрывая текущий анти-паттерн "shared database" (Java-сервис читает таблицу
`users` напрямую — см. `IMPROVEMENTS.md`).

**Почему `BUDGET_RESERVATION` отдельной таблицей, а не счётчиком в `BUDGET`.**
Уникальный constraint `(budget_id, reference)` даёт идемпотентность повторных
вызовов бесплатно — и попутно журнал "что списало бюджет", что частично
закрывает потребность в audit trail (боль №2), хотя полноценным audit log
это не является.
