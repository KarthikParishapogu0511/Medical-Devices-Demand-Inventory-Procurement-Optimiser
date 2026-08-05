import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { runForecastAI, runSupplierRiskAI, runPOAnomalyAI } from './services/gemini.js';
import { dbGet, dbAll, dbRun } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://medical-devices-demand-inventory-procurement-optimis-mf65117ue.vercel.app',
  'https://medical-devices-demand-inventory-procurement-optimis-l6p17oleb.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true });
});

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-medical-optimizer';

// Middleware: Authenticate JWT Token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token missing' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Middleware: Role check
const requireRoles = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: `Forbidden: requires one of the roles: ${roles.join(', ')}` });
  }
  next();
};

// Log action helper
async function logAudit(userId, action, entityType, entityId, prevVal, newVal) {
  const id = 'audit_' + Math.random().toString(36).substr(2, 9);
  await dbRun(
    `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, prev_value, new_value)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, action, entityType, entityId, prevVal ? JSON.stringify(prevVal) : null, newVal ? JSON.stringify(newVal) : null]
  );
}

// ----------------------------------------------------
// Authentication API
// ----------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user || user.status !== 'Active') {
      return res.status(401).json({ error: 'Invalid email or inactive user' });
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: `${user.first_name} ${user.last_name}` },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Update last login
    await dbRun('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    await logAudit(user.id, 'LOGIN', 'user', user.id, null, null);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// Dashboard & Summary API
// ----------------------------------------------------
app.get('/api/dashboard/summary', authenticateToken, async (req, res) => {
  try {
    const itemsCount = await dbGet('SELECT COUNT(*) as count FROM items');
    const lowStockCount = await dbGet('SELECT COUNT(*) as count FROM items WHERE current_stock < safety_stock');
    const openCapas = await dbGet("SELECT COUNT(*) as count FROM capas WHERE status != 'Completed'");
    const activeRisks = await dbGet("SELECT COUNT(*) as count FROM risks WHERE status = 'Open'");

    // Average defect and complaint rates from history
    const qualityMetrics = await dbGet(`
      SELECT 
        AVG(yield_rate) as avg_yield, 
        AVG(defect_rate) as avg_defect, 
        AVG(complaint_rate) as avg_complaints,
        AVG(uptime_percentage) as avg_uptime,
        AVG(service_turnaround_days) as avg_turnaround
      FROM demand_history
    `);

    // Top pending AI recommendations
    const pendingRecs = await dbGet("SELECT COUNT(*) as count FROM ai_recommendations WHERE status = 'Pending Review'");

    res.json({
      total_items: itemsCount.count,
      low_stock_alerts: lowStockCount.count,
      open_capas: openCapas.count,
      active_risks: activeRisks.count,
      pending_ai_recs: pendingRecs.count,
      metrics: {
        yield_rate: qualityMetrics.avg_yield ? Number(qualityMetrics.avg_yield.toFixed(2)) : 98.5,
        defect_rate: qualityMetrics.avg_defect ? Number(qualityMetrics.avg_defect.toFixed(2)) : 1.2,
        complaint_rate: qualityMetrics.avg_complaints ? Number(qualityMetrics.avg_complaints.toFixed(2)) : 0.15,
        device_uptime: qualityMetrics.avg_uptime ? Number(qualityMetrics.avg_uptime.toFixed(2)) : 99.1,
        service_turnaround: qualityMetrics.avg_turnaround ? Number(qualityMetrics.avg_turnaround.toFixed(1)) : 4.5
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// Items & Inventory API
// ----------------------------------------------------
app.get('/api/items', authenticateToken, async (req, res) => {
  const { category, search, location } = req.query;
  let sql = 'SELECT * FROM items WHERE 1=1';
  const params = [];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (location) {
    sql += ' AND location = ?';
    params.push(location);
  }
  if (search) {
    sql += ' AND (name LIKE ? OR sku LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  try {
    const items = await dbAll(sql, params);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/items/:id', authenticateToken, async (req, res) => {
  try {
    const item = await dbGet('SELECT * FROM items WHERE id = ?', [req.params.id]);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    // Attach historical demand, stock movements, quality inspections, and forecasts
    const history = await dbAll('SELECT * FROM demand_history WHERE item_id = ? ORDER BY date ASC', [item.id]);
    const movements = await dbAll('SELECT * FROM stock_movements WHERE item_id = ? ORDER BY timestamp DESC LIMIT 10', [item.id]);
    const inspections = await dbAll('SELECT * FROM inspections WHERE item_id = ? ORDER BY inspection_date DESC', [item.id]);
    const forecasts = await dbAll('SELECT * FROM forecasts WHERE item_id = ? ORDER BY forecast_date DESC LIMIT 5', [item.id]);
    const complaints = await dbAll('SELECT * FROM complaints WHERE item_id = ? ORDER BY complaint_date DESC', [item.id]);

    res.json({
      ...item,
      history,
      movements,
      inspections,
      forecasts,
      complaints
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// Suppliers API
// ----------------------------------------------------
app.get('/api/suppliers', authenticateToken, async (req, res) => {
  try {
    const suppliers = await dbAll('SELECT * FROM suppliers');
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// Planning & AI Recommendations API
// ----------------------------------------------------
app.get('/api/planning/recommendations', authenticateToken, async (req, res) => {
  try {
    const recs = await dbAll('SELECT * FROM ai_recommendations ORDER BY timestamp DESC');
    res.json(recs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve AI Recommendation
app.post('/api/planning/recommendations/:id/approve', authenticateToken, async (req, res) => {
  try {
    const rec = await dbGet('SELECT * FROM ai_recommendations WHERE id = ?', [req.params.id]);
    if (!rec) return res.status(404).json({ error: 'Recommendation not found' });

    const decData = JSON.parse(rec.recommendation_data);

    // Update status
    await dbRun(
      "UPDATE ai_recommendations SET status = 'Approved', reviewer_id = ?, reviewer_decision = 'Approved' WHERE id = ?",
      [req.user.id, rec.id]
    );

    // Action execution depending on the recommendation type
    if (rec.type === 'Reorder') {
      // Create a Purchase Request
      const prId = 'pr_' + Math.random().toString(36).substr(2, 9);
      await dbRun(
        `INSERT INTO purchase_requests (id, item_id, supplier_id, quantity, estimated_cost, status, request_date, reviewer_id)
         VALUES (?, ?, ?, ?, ?, 'Approved', CURRENT_TIMESTAMP, ?)`,
        [prId, rec.target_entity_id, decData.supplier_id, decData.reorder_quantity, decData.cost_estimate, req.user.id]
      );

      // Create actual purchase order
      const poId = 'po_' + Math.random().toString(36).substr(2, 9);
      const poNum = 'PO-' + Math.floor(1000 + Math.random() * 9000);
      await dbRun(
        `INSERT INTO orders (id, purchase_request_id, po_number, status, order_date, total_cost)
         VALUES (?, ?, ?, 'Pending Shipment', CURRENT_TIMESTAMP, ?)`,
        [poId, prId, poNum, decData.cost_estimate]
      );

      // Update open orders count on item
      await dbRun(
        'UPDATE items SET open_orders = open_orders + ? WHERE id = ?',
        [decData.reorder_quantity, rec.target_entity_id]
      );
    } else if (rec.type === 'Transfer') {
      // Perform direct stock level shift simulation or insert movement
      const movementId = 'sm_' + Math.random().toString(36).substr(2, 9);
      await dbRun(
        `INSERT INTO stock_movements (id, item_id, type, quantity, source_location, dest_location, actor_id)
         VALUES (?, ?, 'Transfer', ?, ?, ?, ?)`,
        [movementId, rec.target_entity_id, decData.transfer_quantity, decData.source, decData.destination, req.user.id]
      );
    }

    await logAudit(req.user.id, 'APPROVE_REC', 'ai_recommendation', rec.id, rec, { ...rec, status: 'Approved' });
    res.json({ success: true, message: 'AI Recommendation approved and executed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject / Defer AI Recommendation
app.post('/api/planning/recommendations/:id/reject', authenticateToken, async (req, res) => {
  const { reason } = req.body;
  if (!reason) return res.status(400).json({ error: 'Override or rejection reason is required' });

  try {
    const rec = await dbGet('SELECT * FROM ai_recommendations WHERE id = ?', [req.params.id]);
    if (!rec) return res.status(404).json({ error: 'Recommendation not found' });

    await dbRun(
      "UPDATE ai_recommendations SET status = 'Rejected', reviewer_id = ?, reviewer_decision = 'Rejected', override_reason = ? WHERE id = ?",
      [req.user.id, reason, rec.id]
    );

    await logAudit(req.user.id, 'REJECT_REC', 'ai_recommendation', rec.id, rec, { ...rec, status: 'Rejected', override_reason: reason });
    res.json({ success: true, message: 'Recommendation rejected.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Override AI Recommendation (Edit)
app.post('/api/planning/recommendations/:id/override', authenticateToken, async (req, res) => {
  const { reason, quantity, supplierId } = req.body;
  if (!reason) return res.status(400).json({ error: 'Override explanation reason is required' });

  try {
    const rec = await dbGet('SELECT * FROM ai_recommendations WHERE id = ?', [req.params.id]);
    if (!rec) return res.status(404).json({ error: 'Recommendation not found' });

    const originalData = JSON.parse(rec.recommendation_data);
    const updatedData = { ...originalData };
    if (quantity) updatedData.reorder_quantity = Number(quantity);
    if (supplierId) updatedData.supplier_id = supplierId;

    await dbRun(
      "UPDATE ai_recommendations SET status = 'Overridden', reviewer_id = ?, reviewer_decision = 'Overridden', override_reason = ?, recommendation_data = ? WHERE id = ?",
      [req.user.id, reason, JSON.stringify(updatedData), rec.id]
    );

    // If Reorder type, execute overridden reorder logic
    if (rec.type === 'Reorder') {
      const prId = 'pr_' + Math.random().toString(36).substr(2, 9);
      const estCost = (updatedData.reorder_quantity || originalData.reorder_quantity) * 50.0; // Estimate cost
      await dbRun(
        `INSERT INTO purchase_requests (id, item_id, supplier_id, quantity, estimated_cost, status, request_date, reviewer_id, override_reason)
         VALUES (?, ?, ?, ?, ?, 'Approved', CURRENT_TIMESTAMP, ?, ?)`,
        [prId, rec.target_entity_id, updatedData.supplier_id, updatedData.reorder_quantity, estCost, req.user.id, reason]
      );

      // Create actual purchase order
      const poId = 'po_' + Math.random().toString(36).substr(2, 9);
      const poNum = 'PO-' + Math.floor(1000 + Math.random() * 9000);
      await dbRun(
        `INSERT INTO orders (id, purchase_request_id, po_number, status, order_date, total_cost)
         VALUES (?, ?, ?, 'Pending Shipment', CURRENT_TIMESTAMP, ?)`,
        [poId, prId, poNum, estCost]
      );

      // Update open orders count on item
      await dbRun(
        'UPDATE items SET open_orders = open_orders + ? WHERE id = ?',
        [updatedData.reorder_quantity, rec.target_entity_id]
      );
    }

    await logAudit(req.user.id, 'OVERRIDE_REC', 'ai_recommendation', rec.id, rec, { ...rec, status: 'Overridden', override_reason: reason });
    res.json({ success: true, message: 'AI Recommendation overridden successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger Gemini AI Demand Forecast
app.post('/api/ai/forecast/:itemId', authenticateToken, async (req, res) => {
  try {
    const item = await dbGet('SELECT * FROM items WHERE id = ?', [req.params.itemId]);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const history = await dbAll('SELECT * FROM demand_history WHERE item_id = ? ORDER BY date ASC', [item.id]);

    const result = await runForecastAI(item, history);

    // Save forecast to DB
    const fId = 'f_' + Math.random().toString(36).substr(2, 9);
    await dbRun(
      `INSERT INTO forecasts (id, item_id, forecast_date, forecasted_quantity, confidence_score, explanation, model_version)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [fId, item.id, '2026-09', result.forecasted_quantity, result.confidence_score, result.explanation, 'Gemini 3.5 Flash']
    );

    // Check if safety stock should be adjusted or alert created
    if (result.forecasted_quantity > item.current_stock) {
      const recId = 'rec_' + Math.random().toString(36).substr(2, 9);
      const reorderQty = Math.max(50, result.forecasted_quantity - item.current_stock);
      const costEst = reorderQty * item.unit_cost;
      
      await dbRun(
        `INSERT INTO ai_recommendations (id, type, target_entity_type, target_entity_id, recommendation_data, confidence_score, explanation, status, model_version)
         VALUES (?, 'Reorder', 'item', ?, ?, ?, ?, 'Pending Review', 'Gemini 3.5 Flash')
         ON CONFLICT (id) DO UPDATE SET
           type = excluded.type,
           target_entity_type = excluded.target_entity_type,
           target_entity_id = excluded.target_entity_id,
           recommendation_data = excluded.recommendation_data,
           confidence_score = excluded.confidence_score,
           explanation = excluded.explanation,
           status = excluded.status,
           model_version = excluded.model_version`,
        [recId, item.id, JSON.stringify({ reorder_quantity: reorderQty, supplier_id: 's1', cost_estimate: costEst }), result.confidence_score, result.explanation]
      );
    }

    res.json({ success: true, forecast: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger PO Anomaly Screening
app.post('/api/ai/po-anomaly', authenticateToken, async (req, res) => {
  const { itemId, quantity, supplierId, cost } = req.body;
  if (!itemId || !quantity || !supplierId || !cost) {
    return res.status(400).json({ error: 'itemId, quantity, supplierId, and cost are required' });
  }

  try {
    const item = await dbGet('SELECT * FROM items WHERE id = ?', [itemId]);
    const supplier = await dbGet('SELECT * FROM suppliers WHERE id = ?', [supplierId]);
    if (!item || !supplier) {
      return res.status(404).json({ error: 'Item or supplier not found' });
    }

    const result = await runPOAnomalyAI(item, quantity, supplier, cost);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// Notifications API
// ----------------------------------------------------
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await dbAll('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    await dbRun('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// CAPAs, Inspections, Complaints, Risks, and Audit logs APIs
// ----------------------------------------------------
app.get('/api/capas', authenticateToken, async (req, res) => {
  try {
    const capas = await dbAll('SELECT * FROM capas');
    res.json(capas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/risks', authenticateToken, async (req, res) => {
  try {
    const risks = await dbAll('SELECT * FROM risks');
    res.json(risks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/audit-logs', authenticateToken, async (req, res) => {
  try {
    const logs = await dbAll('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// User Management API
// ----------------------------------------------------
app.get('/api/users', authenticateToken, requireRoles(['Procurement Manager', 'Finance Reviewer']), async (req, res) => {
  try {
    const users = await dbAll('SELECT id, email, role, first_name, last_name, status, last_login, created_at FROM users');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Express Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
