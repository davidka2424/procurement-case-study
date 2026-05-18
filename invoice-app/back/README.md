# invoice-app/back — Invoice payment backend

Java 17 + Spring Boot 3.3 + Spring Data JPA on Postgres. Build with Maven.

## Run with docker compose (recommended)

From the repo root, after the invoice service block is uncommented:

```bash
docker compose up --build invoice-app-back
```

The Spring Boot app listens on `http://localhost:8002`. Once it's up:

- **Swagger UI** → http://localhost:8002/swagger-ui.html
- **OpenAPI JSON** → http://localhost:8002/v3/api-docs
- **OpenAPI YAML** → http://localhost:8002/v3/api-docs.yaml

In Swagger UI, run `POST /auth/login` with `{ "username": "finadmin", "password": "password123" }` first — the response sets the `invoice_token` cookie, after which every other endpoint becomes callable directly from the "Try it out" buttons.

## Run locally

```bash
cd invoice-app/back
# requires JDK 17 and Maven 3.9+
mvn spring-boot:run
```

Set `POSTGRES_HOST` etc. via environment vars to point at a non-default Postgres. The `users` table is owned by the PR backend (`pr-init-db`), so make sure that container has run first — otherwise login fails before this app's tables even matter.

## Endpoints

All routes except `/auth/login` and `/auth/logout` require an `invoice_token` cookie issued by `/auth/login`. The cookie's user must additionally have `role = finance` for any `/invoice` route.

| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | `{username, password}` | Sets `invoice_token` cookie. 401 if creds bad. 403 if role ≠ finance. |
| `POST` | `/auth/logout` | — | Clears the cookie and the server-side session row. |
| `GET`  | `/auth/me` | — | Echoes the current user. 401 if not signed in. |
| `GET`  | `/invoice` | — | List all invoices. Does not include attachment bytes. |
| `POST` | `/invoice` | `multipart/form-data` | Create. Fields: `invoice_number`, `supplier`, `purchase_request_number`, `invoice_sum`, `invoice_sum_paid`, `invoice_status`, `attachment` (file, optional). |
| `PUT`  | `/invoice/{id}` | JSON | Partial update — only the keys you send are applied. |
| `GET`  | `/invoice/{id}/attachment` | — | Streams the PDF. 404 if no file attached. |

## Project layout

```
src/main/java/com/casestudy/invoiceapp/
├── InvoiceApplication.java   # Spring Boot entry point
├── config/
│   └── WebConfig.java        # CORS + BCryptPasswordEncoder bean
├── user/
│   ├── User.java             # Read-only JPA view of shared `users` table
│   └── UserRepository.java
├── auth/
│   ├── InvoiceSession.java   # JPA entity for `invoice_sessions`
│   ├── SessionRepository.java
│   ├── AuthController.java   # /auth/login, /auth/logout, /auth/me
│   ├── CurrentUserFilter.java # OncePerRequestFilter — reads cookie, stuffs user into request
│   └── AuthDtos.java         # LoginRequest, UserResponse
└── invoice/
    ├── Invoice.java          # JPA entity, includes attachment_bytes
    ├── InvoiceRepository.java # findAllSummaries() projects past the byte[]
    ├── InvoiceController.java # CRUD + download endpoint
    └── dto/
        ├── InvoiceSummaryDto.java
        └── InvoiceUpdateDto.java
```

## Shared concerns with the PR backend

This app and the PR backend deliberately know nothing about each other beyond:

1. Both connect to the same Postgres database (`casestudy`).
2. Both read the same `users` table — the PR backend owns the schema and the inserts (`pr-init-db`, `pr-seed-users`); this app only reads.
3. Both use bcrypt for password hashing, with compatible cost factors.

Sessions are **not** shared. Logging into the PR app does not log you into the invoice app and vice-versa. That's by design — making this slicker is part of what a candidate is asked to think about.
