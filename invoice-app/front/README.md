# invoice-app/front — Invoice Payment UI

Vite + React 19 + Mantine 8 + Axios. Same stack as `pr-app/front`. No router, no form library, no state manager.

## Run with docker compose

From the repo root:

```bash
docker compose up --build invoice-app-front
```

Then open http://localhost:5174. Sign in as `finadmin / password123`. The other seed users (`alice`, `bob`) will hit a 403 — this app is finance-only.

## Run locally

```bash
cd invoice-app/front
npm install
npm run dev
```

The frontend expects the Spring backend at `http://localhost:8002`. Override with `VITE_API_URL=http://...` if needed.

## Project layout

```
src/
├── main.jsx                # MantineProvider + AuthProvider + App
├── App.jsx                 # auth gate: <Loader> | <LoginPage> | <InvoiceList>
├── api.js                  # axios client, baseURL 8002, withCredentials: true
├── auth.jsx                # AuthContext + useAuth() hook
└── components/
    ├── LoginPage.jsx       # finance-only login card with restricted-access note
    ├── InvoiceList.jsx     # main screen: header + summary cards + table
    ├── SummaryCards.jsx    # 4 stat cards computed client-side
    ├── UploadInvoiceModal.jsx
    ├── EditInvoiceModal.jsx
    └── StatusBadge.jsx     # status → Mantine Badge (created / prepaid / paid)
```

## Auth behaviour

`POST /auth/login` on the Spring backend returns 403 if the user's role is anything other than `finance`. The login form catches that and shows "This app is finance-only. Sign in with a finance account."

## Things worth noting

- **No live PR lookup.** The edit modal's "Linked purchase request" card is purely informational. The PR number is a free-text string on the invoice — the invoice backend never asks the PR backend whether that PR exists. This is one of the rough edges the case study asks candidates to think about.
- **Summary cards are client-side.** They're computed from the loaded list in `SummaryCards.jsx`. A future iteration should add a backend `/invoice/summary` endpoint so the numbers stay correct under pagination.
- **PDF attachments via cookie-protected URLs.** Download links point at `GET /invoice/{id}/attachment`, which only succeeds with a valid `invoice_token` cookie. That's why we open them with `target="_blank"` rather than fetching the bytes through axios.
