const base = process.env.API_BASE || 'http://localhost:5000/api';

(async () => {
  try {
    const h = await fetch(`${base}/health`);
    console.log('/api/health', h.status, await h.json());

    const loginRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'inventory_planner@hospital.com', password: 'password123' })
    });
    const body = await loginRes.json().catch(() => null);
    console.log('/api/auth/login', loginRes.status, body);
  } catch (err) {
    console.error('Smoke test error:', err.message);
    process.exit(1);
  }
})();
