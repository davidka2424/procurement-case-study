# Senior Developer Case Study

Two small business apps you'd find in any growing company, sharing nothing but a problem.

| App               | What it does                                                                      | Stack                                             |
| ----------------- | --------------------------------------------------------------------------------- | ------------------------------------------------- |
| **`pr-app`**      | Employees raise purchase requests, send them for approval, finance approves them. | React + Vite (front), FastAPI + SQLAlchemy (back) |
| **`invoice-app`** | Finance team uploads supplier invoices and tracks how much has been paid.         | React + Vite (front), Java + Spring Boot (back)   |

Both backends speak HTTP. Both happen to point at the same Postgres database. Neither one knows the other exists.

---

## The business process today

Most of this happens by hand, by email, and in spreadsheets. Here is what a single purchase actually looks like end-to-end.

1. **Request.** An employee opens the **Purchase Request system** and creates a PR — request name, supplier name and email, free-text description. The PR starts in `initiated`.
2. **Send for approval.** The employee flips the PR to `sent for approval` and emails finance the exported PDF with the PR number in the subject line. There is no notification — finance only knows there is something to approve because the email landed.
3. **Approve.** A finance manager opens the PR app separately, hunts for the PR by number, reads it, and switches the status to `approved`. They reply to the email. Again, no notification back to the employee — the employee periodically refreshes the PR app to see if their request has moved.
4. **Send to supplier.** Once approved, the employee emails the PR PDF to the supplier.
5. **Invoice arrives.** The supplier issues an invoice. Depending on their terms it goes one of three ways:
   - back to the employee for **prepayment**, which they forward to `finance@our-company.com`;
   - directly to `finance@our-company.com` for payment;
   - after goods/services are delivered, as a **post-payment** invoice.
6. **Register invoice.** A finance team member opens the **Invoice Payment system**, manually creates an invoice record, types in the supplier and the PR number from the email, attaches the PDF, sets the status (`created`, `prepaid`, or `paid` depending on what was paid so far), and fills in `invoice_sum` / `invoice_sum_paid`.
7. **Export and pay.** Finance exports the invoice to the correspondent bank for payment.
8. **Track outside both systems.** Because the two apps don't talk to each other, finance keeps a separate spreadsheet to reconcile approval status (from system 1) with payment status (from system 2). Employees ping `#finance` on Slack to ask whether their PR has been paid yet.

Communication between everyone in this loop happens either in a shared Slack channel with finance, or — more often — by email.

### Purchase request demo
![Purchase Request Demo](docs/pr-demo.gif)


### Invoice payment demo
![Invoice payment Demo](docs/invoice-demo.gif)

---

## What's painful today

The process above is fragile in specific, well-known ways.

1. **The two systems are not integrated.** Exporting a PR, emailing it to finance, finance finding it again in the other system, all by hand — it takes time and it loses requests. To track what is at which stage, somebody exports both systems to Excel and joins them by hand. Employees have to poll the PR app to find out when something is approved. Finance burns hours just navigating the PR app to figure out what they should look at next.
2. **No real user and role management.** Both apps have a `role` column with two values and that's it. There is no admin UI, no audit trail, no concept of teams, no per-team budgets.
3. **No shared supplier list.** Both systems store the supplier name as free-text on every record. The same supplier shows up four different ways across the database, and finance has no place to keep the supplier's bank details, tax id, payment terms.
4. **No tracking between requested / prepaid / paid.** The PR doesn't carry a "remaining to pay" amount. The invoice has `invoice_sum` and `invoice_sum_paid` but nothing reconciles those against the original request.
5. **An ERP is coming.** Soon a third system, an **ERP**, will sit in this flow. After PR approval, the employee will ask the procurement team to cut a **purchase order** in the ERP, wait for it, and send the PO to the supplier instead of the PR PDF. When finance later gets the invoice, they'll have to identify which PO it belongs to and flag any deltas between what was ordered and what was actually invoiced. None of the current tooling has any concept of a purchase order.

---

## Your task

Integrate the Purchase Request and Invoice systems so that users no longer
need to transfer information between them by hand and can see the relationship
between a purchase request and its invoices.

The business outcome is intentionally more specific than the implementation.
You decide how records are associated, where the relationship lives, how the
systems communicate, and which application owns each piece of data. We want to
see those decisions and the reasoning behind them.

You may change either existing application, change both, add an integration
service, or combine those approaches. You may also replace an existing
technology when the benefit justifies the cost.

### Core deliverables

#### 1. Design note

Complete [`docs/DESIGN.md`](docs/DESIGN.md). We read this first.

Describe your interpretation of the problem, domain model, system boundaries,
integration contracts, data ownership, state flow, assumptions, failure and
ambiguous cases, testing strategy, and explicit trade-offs. State what you
intentionally left out and what you would do next.

The template is a guide, not a required document structure. Change it when a
different structure communicates your design better.

#### 2. Working prototype

Build a focused prototype of the core integration:

- information no longer has to be manually copied between the Purchase Request
  and Invoice systems;
- a user can observe the relationship between a purchase request and its
  invoices;
- the scenario can be demonstrated through the running applications, their
  APIs, or another clearly documented interface.

Include automated tests appropriate to the risks in your design. We deliberately
do not prescribe an API shape, persistence model, matching fields, exact test
cases, or coverage target.

#### 3. Roadmap

In `docs/DESIGN.md`, provide a prioritized roadmap for turning the prototype
into a production system. Separate near-term hardening from broader product
capabilities. Tell us what you would build, in what order, and why.

### Optional extensions

The following are opportunities to demonstrate additional depth, not hidden
requirements:

- integration with the incoming ERP and Purchase Orders;
- richer or automated PR-to-invoice matching;
- payment status and amount-delta visibility;
- supplier master data;
- notifications and audit trail;
- users, roles, teams, and budgets;
- reporting and reconciliation;
- resilience, observability, and performance at scale;
- richer UI or workflow visualization.

Choose only the extensions that strengthen your design.

### Scope and time

There is no hard time limit. We expect a senior candidate to spend somewhere
between half a day and a long weekend, depending on how far they push the
prototype. Quality of judgement matters more than breadth or line count.

A working prototype is the expected submission. If you deliberately limit the
time spent and cannot implement it, a strong design proposal is an acceptable
minimum. Be explicit about the constraint, what remains unimplemented, and the
next implementation steps.

### What we evaluate

We are interested in:

- how you understand and frame the business problem;
- how you decompose and prioritize the work;
- where you draw domain and system boundaries;
- how you reason about contracts, data ownership, state, ambiguity, and
  failures;
- which assumptions and trade-offs you make explicit;
- how focused, reliable, and reviewable the prototype is;
- how you test and demonstrate the result;
- how realistic and well-prioritized your roadmap is.

There is no single expected architecture.

---

## Repo layout

```
.
├── pr-app/
│   ├── back/         FastAPI + SQLAlchemy + uv
│   └── front/        React + Vite + Mantine
├── invoice-app/
│   ├── back/         Java 17 + Spring Boot 3 + JPA
│   └── front/        React + Vite + Mantine
├── docs/
│   └── figma.md      Pointer to the Figma wireframes for both apps
├── docker-compose.yml
└── README.md
```

Each app has its own `README.md` with the local-dev instructions for that piece.

## Running everything

```bash
docker compose up --build
```

The compose stack brings up, in order:

```
db  →  init-db  →  seed-users  ┬→  pr-app-back       →  pr-app-front       (:5173)
                               └→  invoice-app-back  →  invoice-app-front  (:5174)
```

`init-db` and `seed-users` are one-shot containers (`restart: "no"`); the long-running services wait on `condition: service_completed_successfully`.

Once the stack is up:

| Service                                 | URL                                                            |
| --------------------------------------- | -------------------------------------------------------------- |
| PR app (frontend)                       | http://localhost:5173                                          |
| PR app — OpenAPI docs (FastAPI)         | http://localhost:8001/docs                                     |
| Invoice app (frontend)                  | http://localhost:5174                                          |
| Invoice app — OpenAPI docs (Swagger UI) | http://localhost:8002/swagger-ui.html                          |
| Postgres                                | `localhost:5432`, db `casestudy`, user `postgres` / `postgres` |

## Seed users

The `seed-users` one-shot container inserts three accounts. Idempotent — re-running it is a no-op.

| Username | Password    | Role     |
| -------- | ----------- | -------- |
| alice    | password123 | employee |
| bob      | password123 | employee |
| finadmin | password123 | finance  |

The invoice app only accepts users with role `finance`. The PR app accepts both roles but exposes different actions to each.

If you run a backend outside Docker, point it at a reachable Postgres via `DATABASE_URL` (or `POSTGRES_HOST` / `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`). See each backend's README for details.

---

## What's intentionally rough

This repo is the "before" picture. Among other things:

- The two apps share the same Postgres database, but neither owns the schema cleanly. The PR backend's `init-db` job is the only one running migrations; the invoice backend creates its own tables on first boot via Hibernate `ddl-auto: update`.
- The PR app stores supplier name and email as free-text on every request. There is no `suppliers` table.
- The invoice app stores the linked PR number as a free-text string — no foreign key, no validation, no cross-check that the PR even exists.
- Auth is a hand-rolled opaque token in an http-only cookie. There is a session table per app, no refresh, no rotation, no real expiry handling. The two apps don't share sessions; logging into one does not log you into the other.
- There is no integration between the two apps. None.
- Tests are sparse.
- There is no CI.

These are the rocks under the surface. Some of them are on purpose, some of them are just where a real, busy team would have left things. Treat them as your starting list — they are not exhaustive.

---

## Handing it back

Keep your solution and its review history in your own fork. Do not open
candidate-solution pull requests against this source repository.

1. **Fork** this repository to your own GitHub account.
2. Work in feature branches off your fork's `main`.
3. Open pull requests **between branches in your fork**, with your fork's
   `main` as the base branch.
4. Make the completed `docs/DESIGN.md` your first pull request.
5. Submit the implementation as one or more focused pull requests. You decide
   how many PRs make the work easiest to understand and review.
6. In each PR description, explain:
   - the problem and scope of the PR;
   - the important decisions and trade-offs;
   - what you intentionally left out;
   - how you verified the change;
   - what you would do next.
7. When you are done, email `s.nagorny@all3.com` with:
   - a link to your fork;
   - an ordered list of the pull requests you want us to review;
   - instructions for running and reviewing the result;
   - any external design links. Make them publicly viewable or grant access to
     `s.nagorny@all3.com`.

For example:

```text
Fork: https://github.com/<candidate>/procurement-case-study

1. Write the design proposal
   https://github.com/<candidate>/procurement-case-study/pull/1

2. Implement the core integration
   https://github.com/<candidate>/procurement-case-study/pull/2

3. Add an optional extension
   https://github.com/<candidate>/procurement-case-study/pull/3
```

The pull requests may be merged or left open in your fork, provided their diffs
and discussion remain available for review.

Good luck.

## My solution

See docs/solution/ for the full write-up: architecture
and key decisions (README.md), diagrams
(DIAGRAM.md), endpoints/schemas/DDL
(API.md), improvements to each existing system
(IMPROVEMENTS.md), and the feature
roadmap (ROADMAP.md).
