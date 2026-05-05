import { useState, useEffect, useRef } from 'react';
import '@luzmo/embed';

const APP_SERVER = 'https://app.luzmo.com';
const API_HOST   = 'https://api.luzmo.com';

const INFO = [
  {
    icon: '📊',
    title: 'What you are looking at',
    body: `This dashboard pulls live transaction data from Luzmo and renders it directly inside the app. It covers 175 fintech transactions across five European countries and three customer segments (Retail, SME, Enterprise) from April–May 2026.

You can explore the data using the two filters built into the dashboard:
• Country — narrows every chart and KPI to the selected country
• Date range — defaults to the last 30 days; drag to any custom window

Everything updates instantly — no page reload needed.`,
  },
  {
    icon: '🔄',
    title: 'How the data gets here',
    body: `The dashboard is not an iframe you built — it is a live Luzmo dashboard embedded into this React app using the official Luzmo web component.

When the page loads, the app silently calls its own backend to obtain a secure embed token. That token is passed to the <luzmo-embed-dashboard> component, which authenticates with Luzmo and streams the chart data directly from Luzmo's servers into the page.

Your API credentials never touch the browser. Only a short-lived, scoped token is exchanged.`,
  },
  {
    icon: '🔒',
    title: 'Security',
    body: `API keys live exclusively on the server and are never included in any response sent to the browser.

The browser only ever receives a temporary embed token that is:
• Scoped to this one dashboard
• Short-lived
• Useless for any other Luzmo API call

The Vite dev proxy forwards /api requests to the backend, so the browser does not even know a separate server exists.`,
  },
  {
    icon: '🗂️',
    title: 'What the dashboard shows',
    body: `KPIs: Total transactions, successful transaction count, total revenue (€), and per-country revenue breakdown.

Charts:
• Transaction Volume Over Time — daily trend line
• Status Breakdown — Success / Failed / Pending pie
• Count by Country — bar chart across 5 countries
• Count by Customer Segment — Enterprise / Retail / SME
• Revenue Over Time — daily revenue line (Apr–May)
• Revenue by Payment Method — Card, Bank Transfer, Wallet, Crypto`,
  },
];

function InfoPanel({ onClose }) {
  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <span className="panel-title">How it works</span>
          <button className="panel-close" onClick={onClose}>✕</button>
        </div>
        <div className="panel-body">
          {INFO.map((item, i) => (
            <div className="qa-item" key={i}>
              <p className="qa-q">{item.icon} {item.title}</p>
              <p className="qa-a">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="loading-state">
      <div className="spinner-ring" />
      <p className="loading-label">Loading dashboard…</p>
      <p className="loading-sub">Fetching secure embed token from server</p>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="error-state">
      <span className="error-icon">⚠️</span>
      <h3>Could not load dashboard</h3>
      <p>{message}</p>
      <p style={{ marginTop: 8, fontSize: 11 }}>
        Make sure the backend is running on port 3001 and your .env is configured.
      </p>
    </div>
  );
}

export default function App() {
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const dashRef = useRef(null);

  useEffect(() => {
    fetch('/api/luzmo-token')
      .then((res) => {
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setToken(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!dashRef.current || !token) return;
    const el = dashRef.current;
    el.appServer   = APP_SERVER;
    el.apiHost     = API_HOST;
    el.authKey     = token.authKey;
    el.authToken   = token.authToken;
    el.dashboardId = token.dashboardId;
  }, [token]);

  return (
    <div className="app">
      {showPanel && <InfoPanel onClose={() => setShowPanel(false)} />}

      {/* ── Header ────────────────────────────────────────────── */}
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-logo">📊</div>
            <div className="brand-text">
              <h1>Transaction Analytics Dashboard</h1>
              <p>Data fetched from Luzmo · Use the Country &amp; Date filters inside the dashboard to explore</p>
            </div>
          </div>
          <div className="header-right">
            <button className="btn-qa" onClick={() => setShowPanel(true)} title="View assignment Q&A">
              ? How it works
            </button>
            <span className="badge-secure">🔒 Token-secured</span>
            <span className="badge-live">Live</span>
          </div>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────── */}
      <main className="main">
        <div className="dashboard-wrap">
          {loading && <LoadingState />}
          {error   && <ErrorState message={error} />}
          {!loading && !error && (
            <luzmo-embed-dashboard ref={dashRef} />
          )}
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-inner">
          <span>Powered by <strong>Luzmo</strong> Embedded Analytics · Token generated server-side, never exposed client-side</span>
          <a href="https://developer.luzmo.com" target="_blank" rel="noopener noreferrer">
            Luzmo Docs ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
