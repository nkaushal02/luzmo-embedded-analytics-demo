import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Luzmo from '@luzmo/nodejs-sdk';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use(express.json());

// Validate required env vars at startup
const required = ['LUZMO_API_KEY', 'LUZMO_API_TOKEN', 'LUZMO_DASHBOARD_ID'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const luzmoClient = new Luzmo({
  api_key: process.env.LUZMO_API_KEY,
  api_token: process.env.LUZMO_API_TOKEN,
  host: 'https://api.luzmo.com',
});

// GET /api/luzmo-token
// Generates a short-lived embed authorization token server-side.
// API credentials never leave this process.
app.get('/api/luzmo-token', async (req, res) => {
  try {
    const authorization = await luzmoClient.create('authorization', {
      type: 'embed',
      username: 'demo-user-001',
      name: 'Demo Analyst',
      email: 'demo@fintechanalytics.io',
      access: {
        dashboards: [{ id: process.env.LUZMO_DASHBOARD_ID, rights: 'use' }],
      },
    });

    res.json({
      authKey:     authorization.id,
      authToken:   authorization.token,
      dashboardId: process.env.LUZMO_DASHBOARD_ID,
    });
  } catch (err) {
    console.error('[luzmo-token] Error:', err.message);
    res.status(500).json({ error: 'Failed to generate embed token. Check server logs.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}`);
  console.log(`Token endpoint → http://localhost:${PORT}/api/luzmo-token`);
});
