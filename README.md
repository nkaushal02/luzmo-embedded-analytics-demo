# Transaction Analytics Dashboard — Luzmo Embedded Dashboard

A full-stack demo app built for the Luzmo Technical Solutions Engineer assignment.
It embeds a Luzmo dashboard inside a React application with secure server-side token handling.

---

## Quick Start


```bash
# 1. Clone the repository
git clone https://github.com/nkaushal02/luzmo-embedded-analytics-demo.git
cd luzmo-embedded-analytics-demo

# 2. Install all dependencies (installs backend + frontend automatically)
npm install

# 3. Add your credentials
cp .env.example .env   # then fill in LUZMO_API_KEY, LUZMO_API_TOKEN, LUZMO_DASHBOARD_ID

# 4. Start both servers
npm run dev
```

- Frontend → http://localhost:5173  
- Backend  → http://localhost:3001

---

## Project Structure

```
├── server/
│   └── index.js                   # Express backend — token generation only (port 3001)
├── client/
│   ├── src/
│   │   ├── App.jsx                # Main React component + Luzmo embed
│   │   ├── main.jsx               # React entry point
│   │   └── index.css              # Dark-theme styles
│   ├── index.html
│   ├── vite.config.js             # Proxy /api → backend
│   └── package.json
├── fintech_transactions_demo.csv  # 175-row demo dataset (April–May 2026)
├── .env                           # Secrets — never committed
├── .env.example                   # Template for credentials
└── package.json                   # Root: backend deps + concurrently scripts
```


## How the Embedding Works

### High-level flow

```
Browser                   Express (port 3001)           Luzmo API
   │                             │                           │
   │  GET /api/luzmo-token       │                           │
   │────────────────────────────►│                           │
   │                             │  POST /0.1.0/authorization│
   │                             │  { api_key, api_token }   │
   │                             │──────────────────────────►│
   │                             │  { id: authKey,           │
   │                             │    token: authToken }      │
   │                             │◄──────────────────────────│
   │  { authKey, authToken,      │                           │
   │    dashboardId }            │                           │
   │◄────────────────────────────│                           │
   │                             │                           │
   │  <luzmo-embed-dashboard     │                           │
   │     authKey authToken>      │         (direct embed)    │
   │────────────────────────────────────────────────────────►│
```

**Server-side (`server/index.js`):**
- Reads `LUZMO_API_KEY` and `LUZMO_API_TOKEN` from `.env`
- Calls the Luzmo authorization API via `@luzmo/nodejs-sdk`
- Returns a short-lived `authKey` + `authToken` pair to the browser

**Client-side (`client/src/App.jsx`):**
- Fetches `/api/luzmo-token` on mount — hits our own backend, not Luzmo directly
- Receives only the temporary token pair and dashboard ID
- Passes these to `<luzmo-embed-dashboard>` via DOM properties (using a React ref)
- The Luzmo web component authenticates to Luzmo and renders the dashboard

---

## Security Model

| What                  | Where                  | Why                                      |
|-----------------------|------------------------|------------------------------------------|
| `LUZMO_API_KEY`       | Server `.env` only     | Never leaves Node.js process             |
| `LUZMO_API_TOKEN`     | Server `.env` only     | Never leaves Node.js process             |
| `authKey`/`authToken` | Browser (short-lived)  | Scoped embed token — no API access       |
| `LUZMO_DASHBOARD_ID`  | Server `.env` → client | Not secret, but managed server-side      |

The Vite dev server proxies `/api` requests to port 3001, so the browser never needs to know the backend port or make cross-origin requests.

**If you had more time — row-level security:**  
Luzmo supports `parameter_overrides` in the authorization call. You would pass a user's
tenant ID or customer ID as a parameter override so the dashboard's data is automatically
filtered to only that user's rows. The filter lives on the server; the user cannot bypass it.

---

## Demo Dataset

`fintech_transactions_demo.csv` — 175 rows, April–May 2026

| Column               | Values                                          |
|----------------------|-------------------------------------------------|
| transaction_id       | TXN0001 … TXN0175                               |
| date                 | 2026-04-01 … 2026-05-31                         |
| customer_segment     | Retail, SME, Enterprise                         |
| country              | Belgium, Netherlands, France, Germany, Spain    |
| payment_method       | Card, Bank Transfer, Wallet, Crypto             |
| status               | Success (80%), Failed (12%), Pending (8%)       |
| amount_eur           | €10 – €5,000 (varies by segment)               |
| processing_time_ms   | 100 – 2,500 ms                                  |

Import this file into Luzmo as a CSV dataset, then build your dashboard on top of it.