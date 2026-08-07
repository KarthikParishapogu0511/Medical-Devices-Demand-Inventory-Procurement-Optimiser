import bcrypt from 'bcryptjs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const dbPath = process.env.SQLITE_PATH || path.resolve(process.cwd(), 'data', 'database.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const openDb = async () => {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  await db.exec('PRAGMA foreign_keys = ON');
  return db;
};

const run = async (sql, params = []) => {
  const db = await openDb();
  const result = await db.run(sql, params);
  await db.close();
  return result;
};

const insertRows = async (sql, rows) => {
  const db = await openDb();
  await db.exec('BEGIN');
  try {
    for (const row of rows) {
      await db.run(sql, row);
    }
    await db.exec('COMMIT');
  } catch (err) {
    await db.exec('ROLLBACK');
    throw err;
  } finally {
    await db.close();
  }
};

const seed = async () => {
  console.log('Creating database tables...');

  await run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    status TEXT DEFAULT 'Active',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    description TEXT,
    current_stock INTEGER DEFAULT 0,
    safety_stock INTEGER DEFAULT 0,
    lead_time_days INTEGER DEFAULT 7,
    location TEXT NOT NULL,
    bin TEXT,
    lot_number TEXT,
    expiry_date DATE,
    age_days INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    open_orders INTEGER DEFAULT 0,
    unit_cost NUMERIC(12,2) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    quality_score REAL DEFAULT 100.0,
    delivery_reliability REAL DEFAULT 100.0,
    risk_score REAL DEFAULT 0.0,
    lead_time_days INTEGER DEFAULT 7,
    status TEXT DEFAULT 'Qualified',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL REFERENCES items(id),
    type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    source_location TEXT,
    dest_location TEXT,
    reference_id TEXT,
    actor_id TEXT REFERENCES users(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS demand_history (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL REFERENCES items(id),
    date DATE NOT NULL,
    quantity_demanded INTEGER NOT NULL,
    yield_rate REAL DEFAULT 100.0,
    defect_rate REAL DEFAULT 0.0,
    complaint_rate REAL DEFAULT 0.0,
    uptime_percentage REAL DEFAULT 100.0,
    service_turnaround_days REAL DEFAULT 0.0
  )`);

  await run(`CREATE TABLE IF NOT EXISTS forecasts (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL REFERENCES items(id),
    forecast_date DATE NOT NULL,
    forecasted_quantity INTEGER NOT NULL,
    confidence_score REAL DEFAULT 0.0,
    explanation TEXT,
    model_version TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS inspections (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL REFERENCES items(id),
    lot_number TEXT NOT NULL,
    inspector_id TEXT NOT NULL REFERENCES users(id),
    inspection_date DATE NOT NULL,
    quantity_inspected INTEGER NOT NULL,
    quantity_passed INTEGER NOT NULL,
    quantity_failed INTEGER NOT NULL,
    defect_type TEXT,
    status TEXT NOT NULL
  )`);

  await run(`CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL REFERENCES items(id),
    lot_number TEXT NOT NULL,
    complaint_date DATE NOT NULL,
    description TEXT,
    severity TEXT NOT NULL,
    status TEXT DEFAULT 'Open',
    resolution TEXT
  )`);

  await run(`CREATE TABLE IF NOT EXISTS capas (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    status TEXT DEFAULT 'Open',
    assigned_to TEXT REFERENCES users(id),
    aging_days INTEGER DEFAULT 0,
    target_completion_date DATE,
    completed_date DATE
  )`);

  await run(`CREATE TABLE IF NOT EXISTS risks (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    likelihood INTEGER NOT NULL,
    impact INTEGER NOT NULL,
    score INTEGER NOT NULL,
    mitigation_plan TEXT,
    status TEXT DEFAULT 'Open'
  )`);

  await run(`CREATE TABLE IF NOT EXISTS ai_recommendations (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    target_entity_type TEXT NOT NULL,
    target_entity_id TEXT NOT NULL,
    recommendation_data TEXT NOT NULL,
    confidence_score REAL NOT NULL,
    explanation TEXT NOT NULL,
    status TEXT DEFAULT 'Pending Review',
    model_version TEXT NOT NULL,
    reviewer_id TEXT REFERENCES users(id),
    reviewer_decision TEXT,
    override_reason TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    prev_value TEXT,
    new_value TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT
  )`);

  await run(`CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    severity TEXT DEFAULT 'Low',
    is_read BOOLEAN DEFAULT FALSE,
    related_entity_type TEXT,
    related_entity_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS purchase_requests (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL REFERENCES items(id),
    supplier_id TEXT NOT NULL REFERENCES suppliers(id),
    quantity INTEGER NOT NULL,
    estimated_cost NUMERIC(12,2),
    status TEXT NOT NULL,
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewer_id TEXT REFERENCES users(id),
    override_reason TEXT
  )`);

  await run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    purchase_request_id TEXT REFERENCES purchase_requests(id),
    po_number TEXT NOT NULL,
    status TEXT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_cost NUMERIC(12,2)
  )`);

  console.log('Tables created. Seeding data...');

  const salt = bcrypt.genSaltSync(8);
  const hashedDefaultPassword = bcrypt.hashSync('password123', salt);

  const users = [
    ['u1', 'procurement_mgr@hospital.com', hashedDefaultPassword, 'Procurement Manager', 'Priya', 'Sharma'],
    ['u2', 'inventory_planner@hospital.com', hashedDefaultPassword, 'Inventory Planner', 'Arjun', 'Reddy'],
    ['u3', 'warehouse_user@hospital.com', hashedDefaultPassword, 'Warehouse User', 'Karthik', 'Nair'],
    ['u4', 'supplier_user@hospital.com', hashedDefaultPassword, 'Supplier', 'Meera', 'Iyer'],
    ['u5', 'finance_reviewer@hospital.com', hashedDefaultPassword, 'Finance Reviewer', 'Ananya', 'Gupta']
  ];

  await insertRows(
    `INSERT INTO users (id, email, password_hash, role, first_name, last_name)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id) DO UPDATE SET
       email = excluded.email,
       password_hash = excluded.password_hash,
       role = excluded.role,
       first_name = excluded.first_name,
       last_name = excluded.last_name`,
    users
  );

  const suppliers = [
    ['s1', 'BioSensors Inc.', 'orders@biosensors.com', 96.5, 98.2, 1.2, 5, 'Qualified'],
    ['s2', 'MedPack Global', 'supply@medpack.com', 99.1, 94.5, 2.5, 10, 'Qualified'],
    ['s3', 'Apex Spare Parts', 'support@apexparts.com', 82.3, 85.0, 5.8, 15, 'Under Review'],
    ['s4', 'CalibraTech', 'info@calibratech.com', 95.0, 97.0, 1.8, 7, 'Qualified']
  ];

  await insertRows(
    `INSERT INTO suppliers (id, name, contact_email, quality_score, delivery_reliability, risk_score, lead_time_days, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET
       name = excluded.name,
       contact_email = excluded.contact_email,
       quality_score = excluded.quality_score,
       delivery_reliability = excluded.delivery_reliability,
       risk_score = excluded.risk_score,
       lead_time_days = excluded.lead_time_days,
       status = excluded.status`,
    suppliers
  );

  const items = [
    ['i1', 'Oxygen Flow Sensor', 'SKU-SN-001', 'sensors', 'units', 'High-precision oxygen flow sensor for ventilators.', 120, 150, 5, 'Warehouse A', 'A-12', 'LOT-99882', '2027-12-31', 45, 10, 50, 45.0],
    ['i2', 'ECG Lead Cable 5-Lead', 'SKU-CP-002', 'components', 'units', 'Shielded 5-lead ECG trunk cable.', 450, 200, 8, 'Warehouse A', 'B-04', 'LOT-88273', '2028-06-15', 12, 0, 0, 75.0],
    ['i3', 'Sterile Device Outer Shell Packaging', 'SKU-PK-003', 'packaging', 'box', 'Validated sterile barrier packaging box.', 80, 100, 10, 'Warehouse B', 'C-01', 'LOT-77123', '2026-12-01', 90, 15, 120, 12.5],
    ['i4', 'Ventilator Backup Battery Pack', 'SKU-SP-004', 'spare parts', 'units', 'Rechargeable Li-ion backup battery pack.', 35, 50, 15, 'Warehouse A', 'D-15', 'LOT-66551', '2028-01-10', 110, 5, 20, 180.0],
    ['i5', 'Calibration Gas Cylinder (N2/CO2)', 'SKU-CM-005', 'calibration materials', 'units', 'Mixed calibration gas cylinder for blood gas analysers.', 15, 20, 7, 'Warehouse B', 'GAS-02', 'LOT-55443', '2026-09-30', 210, 2, 10, 120.0],
    ['i6', 'Portable Cardiac Monitor V4', 'SKU-FD-006', 'finished devices', 'units', 'Fully assembled portable patient cardiac monitor.', 28, 15, 12, 'Warehouse A', 'F-08', 'LOT-44332', '2029-05-20', 5, 8, 0, 1200.0]
  ];

  await insertRows(
    `INSERT INTO items (id, name, sku, category, unit, description, current_stock, safety_stock, lead_time_days, location, bin, lot_number, expiry_date, age_days, reserved_quantity, open_orders, unit_cost)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
     ON CONFLICT (id) DO UPDATE SET
       name = excluded.name,
       sku = excluded.sku,
       category = excluded.category,
       unit = excluded.unit,
       description = excluded.description,
       current_stock = excluded.current_stock,
       safety_stock = excluded.safety_stock,
       lead_time_days = excluded.lead_time_days,
       location = excluded.location,
       bin = excluded.bin,
       lot_number = excluded.lot_number,
       expiry_date = excluded.expiry_date,
       age_days = excluded.age_days,
       reserved_quantity = excluded.reserved_quantity,
       open_orders = excluded.open_orders,
       unit_cost = excluded.unit_cost`,
    items
  );

  const months = ['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07'];
  const demandHistory = [];

  months.forEach((m, idx) => {
    const baseDemand = 90 + Math.floor(Math.sin(idx) * 20) + Math.floor(Math.random() * 15);
    demandHistory.push([`dh_i1_${m}`, 'i1', `${m}-01`, baseDemand, 98.5, 1.5, 0.2, 99.2, 3.5]);
  });
  months.forEach(() => {
    const baseDemand = 20 + Math.floor(Math.random() * 10);
    demandHistory.push([`dh_i4_${months[demandHistory.length % months.length]}`, 'i4', `${months[demandHistory.length % months.length]}-01`, baseDemand, 99.1, 0.9, 0.1, 98.7, 5.0]);
  });
  months.forEach(() => {
    const baseDemand = 10 + Math.floor(Math.random() * 5);
    demandHistory.push([`dh_i6_${months[demandHistory.length % months.length]}`, 'i6', `${months[demandHistory.length % months.length]}-01`, baseDemand, 97.8, 2.2, 0.4, 99.5, 10.0]);
  });

  await insertRows(
    `INSERT INTO demand_history (id, item_id, date, quantity_demanded, yield_rate, defect_rate, complaint_rate, uptime_percentage, service_turnaround_days)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO UPDATE SET
       item_id = excluded.item_id,
       date = excluded.date,
       quantity_demanded = excluded.quantity_demanded,
       yield_rate = excluded.yield_rate,
       defect_rate = excluded.defect_rate,
       complaint_rate = excluded.complaint_rate,
       uptime_percentage = excluded.uptime_percentage,
       service_turnaround_days = excluded.service_turnaround_days`,
    demandHistory
  );

  const forecasts = [
    ['f1', 'i1', '2026-08-01', 115, 0.88, 'AI demand forecast based on standard seasonal trend and low defect rates.', 'V1.0.2'],
    ['f2', 'i4', '2026-08-01', 28, 0.82, 'Slightly higher projected demand due to upcoming preventative maintenance cycles.', 'V1.0.2'],
    ['f3', 'i6', '2026-08-01', 14, 0.91, 'Forecast matching the stable client order book for Q3.', 'V1.0.2']
  ];

  await insertRows(
    `INSERT INTO forecasts (id, item_id, forecast_date, forecasted_quantity, confidence_score, explanation, model_version)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       item_id = excluded.item_id,
       forecast_date = excluded.forecast_date,
       forecasted_quantity = excluded.forecasted_quantity,
       confidence_score = excluded.confidence_score,
       explanation = excluded.explanation,
       model_version = excluded.model_version`,
    forecasts
  );

  const movements = [
    ['sm1', 'i1', 'Receipt', 50, 's1', 'Warehouse A', 'PO-9911', 'u3', '2026-07-28 10:15:00'],
    ['sm2', 'i4', 'Issue', 5, 'Warehouse A', 'Service Center', 'SRV-8822', 'u3', '2026-08-01 14:30:00'],
    ['sm3', 'i6', 'Transfer', 2, 'Warehouse A', 'Warehouse B', 'TR-0044', 'u3', '2026-08-02 09:00:00']
  ];

  await insertRows(
    `INSERT INTO stock_movements (id, item_id, type, quantity, source_location, dest_location, reference_id, actor_id, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO UPDATE SET
       item_id = excluded.item_id,
       type = excluded.type,
       quantity = excluded.quantity,
       source_location = excluded.source_location,
       dest_location = excluded.dest_location,
       reference_id = excluded.reference_id,
       actor_id = excluded.actor_id,
       timestamp = excluded.timestamp`,
    movements
  );

  const inspections = [
    ['ins1', 'i1', 'LOT-99882', 'u3', '2026-07-28', 50, 48, 2, 'Slight scale deviation', 'Passed'],
    ['ins2', 'i3', 'LOT-77123', 'u3', '2026-07-30', 20, 12, 8, 'Sterile bag puncture', 'Failed']
  ];

  await insertRows(
    `INSERT INTO inspections (id, item_id, lot_number, inspector_id, inspection_date, quantity_inspected, quantity_passed, quantity_failed, defect_type, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (id) DO UPDATE SET
       item_id = excluded.item_id,
       lot_number = excluded.lot_number,
       inspector_id = excluded.inspector_id,
       inspection_date = excluded.inspection_date,
       quantity_inspected = excluded.quantity_inspected,
       quantity_passed = excluded.quantity_passed,
       quantity_failed = excluded.quantity_failed,
       defect_type = excluded.defect_type,
       status = excluded.status`,
    inspections
  );

  const complaints = [
    ['c1', 'i1', 'LOT-99882', '2026-07-25', 'Flow rate fluctuation reported during hospital ventilation check.', 'High', 'Investigating', 'Calibration validation in progress.'],
    ['c2', 'i4', 'LOT-66551', '2026-07-29', 'Battery failed to hold charge beyond 4 hours (specified 6 hrs).', 'Medium', 'Open', null]
  ];

  await insertRows(
    `INSERT INTO complaints (id, item_id, lot_number, complaint_date, description, severity, status, resolution)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET
       item_id = excluded.item_id,
       lot_number = excluded.lot_number,
       complaint_date = excluded.complaint_date,
       description = excluded.description,
       severity = excluded.severity,
       status = excluded.status,
       resolution = excluded.resolution`,
    complaints
  );

  const capas = [
    ['capa1', 'Recalibration of Sensor Test Bench', 'Improve calibration precision to resolve flow fluctuations.', 'Customer Complaint', 'c1', 'In Progress', 'u2', 10, '2026-08-15', null],
    ['capa2', 'Packaging Batch Redesign', 'Rectify sterile bag puncture issue detected in MedPack global delivery.', 'Inspection Failure', 'ins2', 'Open', 'u1', 5, '2026-08-20', null]
  ];

  await insertRows(
    `INSERT INTO capas (id, title, description, source_type, source_id, status, assigned_to, aging_days, target_completion_date, completed_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (id) DO UPDATE SET
       title = excluded.title,
       description = excluded.description,
       source_type = excluded.source_type,
       source_id = excluded.source_id,
       status = excluded.status,
       assigned_to = excluded.assigned_to,
       aging_days = excluded.aging_days,
       target_completion_date = excluded.target_completion_date,
       completed_date = excluded.completed_date`,
    capas
  );

  const risks = [
    ['r1', 'Supply Chain', 'Lead time spike due to sensor manufacturer customs delays.', 4, 3, 12, 'Diversify supply to European distributors.', 'Open'],
    ['r2', 'Quality', 'Aging inventory of Sterile packaging (expires Dec 2026).', 3, 4, 12, 'Expedite first-in-first-out usage workflow.', 'Open']
  ];

  await insertRows(
    `INSERT INTO risks (id, category, description, likelihood, impact, score, mitigation_plan, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET
       category = excluded.category,
       description = excluded.description,
       likelihood = excluded.likelihood,
       impact = excluded.impact,
       score = excluded.score,
       mitigation_plan = excluded.mitigation_plan,
       status = excluded.status`,
    risks
  );

  const recs = [
    [
      'rec1',
      'Reorder',
      'item',
      'i1',
      JSON.stringify({ reorder_quantity: 80, supplier_id: 's1', cost_estimate: 3600 }),
      0.92,
      'Oxygen Flow Sensor is below safety stock threshold (120 vs safety 150). Recommended order: 80 units from BioSensors Inc.',
      'Pending Review',
      'Gemini 3.5 Pro V1'
    ],
    [
      'rec2',
      'Transfer',
      'item',
      'i4',
      JSON.stringify({ transfer_quantity: 10, source: 'Warehouse B', destination: 'Warehouse A' }),
      0.85,
      'Optimise ventilator backup battery pack layout by transferring 10 excess units from Warehouse B to A.',
      'Pending Review',
      'Gemini 3.5 Pro V1'
    ],
    [
      'rec3',
      'Supplier Risk',
      'supplier',
      's3',
      JSON.stringify({ warning: 'High risk detected', factor: 'Quality score dropped to 82.3%' }),
      0.78,
      'Apex Spare Parts flagged under review due to increased defect rate in recent spare parts shipments.',
      'Pending Review',
      'Gemini 3.5 Pro V1'
    ]
  ];

  await insertRows(
    `INSERT INTO ai_recommendations (id, type, target_entity_type, target_entity_id, recommendation_data, confidence_score, explanation, status, model_version)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO UPDATE SET
       type = excluded.type,
       target_entity_type = excluded.target_entity_type,
       target_entity_id = excluded.target_entity_id,
       recommendation_data = excluded.recommendation_data,
       confidence_score = excluded.confidence_score,
       explanation = excluded.explanation,
       status = excluded.status,
       model_version = excluded.model_version`,
    recs
  );

  const notifications = [
    ['n1', 'u1', 'Critical Safety Stock Alert', 'Oxygen Flow Sensor (SKU-SN-001) has dropped below safety stock!', 'Alert', 'High', false, 'item', 'i1'],
    ['n2', 'u2', 'New AI Reorder Recommendation', 'Reorder 80 units of Oxygen Flow Sensor proposed.', 'Recommendation', 'Medium', false, 'ai_recommendation', 'rec1'],
    ['n3', 'u1', 'CAPA Deadline Approaching', 'Packaging Batch Redesign CAPA is due in 15 days.', 'Action Required', 'Medium', false, 'capa', 'capa2']
  ];

  await insertRows(
    `INSERT INTO notifications (id, user_id, title, message, type, severity, is_read, related_entity_type, related_entity_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO UPDATE SET
       user_id = excluded.user_id,
       title = excluded.title,
       message = excluded.message,
       type = excluded.type,
       severity = excluded.severity,
       is_read = excluded.is_read,
       related_entity_type = excluded.related_entity_type,
       related_entity_id = excluded.related_entity_id`,
    notifications
  );

  console.log('Database seeded successfully.');
};

seed().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
