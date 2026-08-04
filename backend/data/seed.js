import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('Creating database tables...');

  // Users
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    status TEXT DEFAULT 'Active',
    last_login TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Organizations
  db.run(`CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Items
  db.run(`CREATE TABLE IF NOT EXISTS items (
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
    expiry_date TEXT,
    age_days INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    open_orders INTEGER DEFAULT 0,
    unit_cost REAL DEFAULT 0.0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Suppliers
  db.run(`CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    quality_score REAL DEFAULT 100.0,
    delivery_reliability REAL DEFAULT 100.0,
    risk_score REAL DEFAULT 0.0,
    lead_time_days INTEGER DEFAULT 7,
    status TEXT DEFAULT 'Qualified',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  // Stock Movements
  db.run(`CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    source_location TEXT,
    dest_location TEXT,
    reference_id TEXT,
    actor_id TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(item_id) REFERENCES items(id),
    FOREIGN KEY(actor_id) REFERENCES users(id)
  )`);

  // Demand History
  db.run(`CREATE TABLE IF NOT EXISTS demand_history (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    date TEXT NOT NULL,
    quantity_demanded INTEGER NOT NULL,
    yield_rate REAL DEFAULT 100.0,
    defect_rate REAL DEFAULT 0.0,
    complaint_rate REAL DEFAULT 0.0,
    uptime_percentage REAL DEFAULT 100.0,
    service_turnaround_days REAL DEFAULT 0.0,
    FOREIGN KEY(item_id) REFERENCES items(id)
  )`);

  // Forecasts
  db.run(`CREATE TABLE IF NOT EXISTS forecasts (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    forecast_date TEXT NOT NULL,
    forecasted_quantity INTEGER NOT NULL,
    confidence_score REAL DEFAULT 0.0,
    explanation TEXT,
    model_version TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(item_id) REFERENCES items(id)
  )`);

  // Inspections
  db.run(`CREATE TABLE IF NOT EXISTS inspections (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    lot_number TEXT NOT NULL,
    inspector_id TEXT NOT NULL,
    inspection_date TEXT NOT NULL,
    quantity_inspected INTEGER NOT NULL,
    quantity_passed INTEGER NOT NULL,
    quantity_failed INTEGER NOT NULL,
    defect_type TEXT,
    status TEXT NOT NULL,
    FOREIGN KEY(item_id) REFERENCES items(id),
    FOREIGN KEY(inspector_id) REFERENCES users(id)
  )`);

  // Complaints
  db.run(`CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    lot_number TEXT NOT NULL,
    complaint_date TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL,
    status TEXT DEFAULT 'Open',
    resolution TEXT,
    FOREIGN KEY(item_id) REFERENCES items(id)
  )`);

  // CAPAs
  db.run(`CREATE TABLE IF NOT EXISTS capas (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    status TEXT DEFAULT 'Open',
    assigned_to TEXT,
    aging_days INTEGER DEFAULT 0,
    target_completion_date TEXT,
    completed_date TEXT,
    FOREIGN KEY(assigned_to) REFERENCES users(id)
  )`);

  // Risks
  db.run(`CREATE TABLE IF NOT EXISTS risks (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    likelihood INTEGER NOT NULL,
    impact INTEGER NOT NULL,
    score INTEGER NOT NULL,
    mitigation_plan TEXT,
    status TEXT DEFAULT 'Open'
  )`);

  // AI Recommendations
  db.run(`CREATE TABLE IF NOT EXISTS ai_recommendations (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    target_entity_type TEXT NOT NULL,
    target_entity_id TEXT NOT NULL,
    recommendation_data TEXT NOT NULL,
    confidence_score REAL NOT NULL,
    explanation TEXT NOT NULL,
    status TEXT DEFAULT 'Pending Review',
    model_version TEXT NOT NULL,
    reviewer_id TEXT,
    reviewer_decision TEXT,
    override_reason TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(reviewer_id) REFERENCES users(id)
  )`);

  // Audit Logs
  db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    prev_value TEXT,
    new_value TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT
  )`);

  // Notifications
  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    severity TEXT DEFAULT 'Low',
    is_read INTEGER DEFAULT 0,
    related_entity_type TEXT,
    related_entity_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  console.log('Tables created. Seeding data...');

  // 1. Users Seeding
  const salt = bcrypt.genSaltSync(8);
  const hashedDefaultPassword = bcrypt.hashSync('password123', salt);

  const users = [
    ['u1', 'procurement_mgr@hospital.com', hashedDefaultPassword, 'Procurement Manager', 'Sarah', 'Jenkins'],
    ['u2', 'inventory_planner@hospital.com', hashedDefaultPassword, 'Inventory Planner', 'Alex', 'Rivera'],
    ['u3', 'warehouse_user@hospital.com', hashedDefaultPassword, 'Warehouse User', 'Marcus', 'Chen'],
    ['u4', 'supplier_user@hospital.com', hashedDefaultPassword, 'Supplier', 'Dieter', 'Meier'],
    ['u5', 'finance_reviewer@hospital.com', hashedDefaultPassword, 'Finance Reviewer', 'Elena', 'Rostova']
  ];

  const insertUser = db.prepare('INSERT OR REPLACE INTO users (id, email, password_hash, role, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?)');
  users.forEach(u => insertUser.run(u));
  insertUser.finalize();

  // 2. Suppliers Seeding
  const suppliers = [
    ['s1', 'BioSensors Inc.', 'orders@biosensors.com', 96.5, 98.2, 1.2, 5, 'Qualified'],
    ['s2', 'MedPack Global', 'supply@medpack.com', 99.1, 94.5, 2.5, 10, 'Qualified'],
    ['s3', 'Apex Spare Parts', 'support@apexparts.com', 82.3, 85.0, 5.8, 15, 'Under Review'],
    ['s4', 'CalibraTech', 'info@calibratech.com', 95.0, 97.0, 1.8, 7, 'Qualified']
  ];
  const insertSupplier = db.prepare('INSERT OR REPLACE INTO suppliers (id, name, contact_email, quality_score, delivery_reliability, risk_score, lead_time_days, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  suppliers.forEach(s => insertSupplier.run(s));
  insertSupplier.finalize();

  // 3. Items Seeding
  const items = [
    ['i1', 'Oxygen Flow Sensor', 'SKU-SN-001', 'sensors', 'units', 'High-precision oxygen flow sensor for ventilators.', 120, 150, 5, 'Warehouse A', 'A-12', 'LOT-99882', '2027-12-31', 45, 10, 50, 45.00],
    ['i2', 'ECG Lead Cable 5-Lead', 'SKU-CP-002', 'components', 'units', 'Shielded 5-lead ECG trunk cable.', 450, 200, 8, 'Warehouse A', 'B-04', 'LOT-88273', '2028-06-15', 12, 0, 0, 75.00],
    ['i3', 'Sterile Device Outer Shell Packaging', 'SKU-PK-003', 'packaging', 'box', 'Validated sterile barrier packaging box.', 80, 100, 10, 'Warehouse B', 'C-01', 'LOT-77123', '2026-12-01', 90, 15, 120, 12.50],
    ['i4', 'Ventilator Backup Battery Pack', 'SKU-SP-004', 'spare parts', 'units', 'Rechargeable Li-ion backup battery pack.', 35, 50, 15, 'Warehouse A', 'D-15', 'LOT-66551', '2028-01-10', 110, 5, 20, 180.00],
    ['i5', 'Calibration Gas Cylinder (N2/CO2)', 'SKU-CM-005', 'calibration materials', 'units', 'Mixed calibration gas cylinder for blood gas analysers.', 15, 20, 7, 'Warehouse B', 'GAS-02', 'LOT-55443', '2026-09-30', 210, 2, 10, 120.00],
    ['i6', 'Portable Cardiac Monitor V4', 'SKU-FD-006', 'finished devices', 'units', 'Fully assembled portable patient cardiac monitor.', 28, 15, 12, 'Warehouse A', 'F-08', 'LOT-44332', '2029-05-20', 5, 8, 0, 1200.00]
  ];
  const insertItem = db.prepare('INSERT OR REPLACE INTO items (id, name, sku, category, unit, description, current_stock, safety_stock, lead_time_days, location, bin, lot_number, expiry_date, age_days, reserved_quantity, open_orders, unit_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  items.forEach(i => insertItem.run(i));
  insertItem.finalize();

  // 4. Demand History Seeding (12 months back)
  const months = ['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07'];
  const demandHistory = [];
  
  // Item 1 (Oxygen Flow Sensor): Avg demand ~100, defect rate ~1.5%, complaints ~0.2%, uptime ~99%
  months.forEach((m, idx) => {
    const baseDemand = 90 + Math.floor(Math.sin(idx) * 20) + Math.floor(Math.random() * 15);
    demandHistory.push([`dh_i1_${m}`, 'i1', m, baseDemand, 98.5, 1.5, 0.2, 99.2, 3.5]);
  });

  // Item 4 (Ventilator Backup Battery): Avg demand ~25
  months.forEach((m, idx) => {
    const baseDemand = 20 + Math.floor(Math.random() * 10);
    demandHistory.push([`dh_i4_${m}`, 'i4', m, baseDemand, 99.1, 0.9, 0.1, 98.7, 5.0]);
  });

  // Item 6 (Finished Device): Avg demand ~12
  months.forEach((m, idx) => {
    const baseDemand = 10 + Math.floor(Math.random() * 5);
    demandHistory.push([`dh_i6_${m}`, 'i6', m, baseDemand, 97.8, 2.2, 0.4, 99.5, 10.0]);
  });

  const insertDemand = db.prepare('INSERT OR REPLACE INTO demand_history (id, item_id, date, quantity_demanded, yield_rate, defect_rate, complaint_rate, uptime_percentage, service_turnaround_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  demandHistory.forEach(dh => insertDemand.run(dh));
  insertDemand.finalize();

  // 5. Forecasts Seeding
  const forecasts = [
    ['f1', 'i1', '2026-08', 115, 0.88, 'AI demand forecast based on standard seasonal trend and low defect rates.', 'V1.0.2'],
    ['f2', 'i4', '2026-08', 28, 0.82, 'Slightly higher projected demand due to upcoming preventative maintenance cycles.', 'V1.0.2'],
    ['f3', 'i6', '2026-08', 14, 0.91, 'Forecast matching the stable client order book for Q3.', 'V1.0.2']
  ];
  const insertForecast = db.prepare('INSERT OR REPLACE INTO forecasts (id, item_id, forecast_date, forecasted_quantity, confidence_score, explanation, model_version) VALUES (?, ?, ?, ?, ?, ?, ?)');
  forecasts.forEach(f => insertForecast.run(f));
  insertForecast.finalize();

  // 6. Stock Movements Seeding
  const movements = [
    ['sm1', 'i1', 'Receipt', 50, 's1', 'Warehouse A', 'PO-9911', 'u3', '2026-07-28 10:15:00'],
    ['sm2', 'i4', 'Issue', 5, 'Warehouse A', 'Service Center', 'SRV-8822', 'u3', '2026-08-01 14:30:00'],
    ['sm3', 'i6', 'Transfer', 2, 'Warehouse A', 'Warehouse B', 'TR-0044', 'u3', '2026-08-02 09:00:00']
  ];
  const insertMovement = db.prepare('INSERT OR REPLACE INTO stock_movements (id, item_id, type, quantity, source_location, dest_location, reference_id, actor_id, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  movements.forEach(m => insertMovement.run(m));
  insertMovement.finalize();

  // 7. Inspections Seeding
  const inspections = [
    ['ins1', 'i1', 'LOT-99882', 'u3', '2026-07-28', 50, 48, 2, 'Slight scale deviation', 'Passed'],
    ['ins2', 'i3', 'LOT-77123', 'u3', '2026-07-30', 20, 12, 8, 'Sterile bag puncture', 'Failed']
  ];
  const insertInspection = db.prepare('INSERT OR REPLACE INTO inspections (id, item_id, lot_number, inspector_id, inspection_date, quantity_inspected, quantity_passed, quantity_failed, defect_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  inspections.forEach(i => insertInspection.run(i));
  insertInspection.finalize();

  // 8. Complaints Seeding
  const complaints = [
    ['c1', 'i1', 'LOT-99882', '2026-07-25', 'Flow rate fluctuation reported during hospital ventilation check.', 'High', 'Investigating', 'Calibration validation in progress.'],
    ['c2', 'i4', 'LOT-66551', '2026-07-29', 'Battery failed to hold charge beyond 4 hours (specified 6 hrs).', 'Medium', 'Open', '']
  ];
  const insertComplaint = db.prepare('INSERT OR REPLACE INTO complaints (id, item_id, lot_number, complaint_date, description, severity, status, resolution) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  complaints.forEach(c => insertComplaint.run(c));
  insertComplaint.finalize();

  // 9. CAPAs Seeding
  const capas = [
    ['capa1', 'Recalibration of Sensor Test Bench', 'Improve calibration precision to resolve flow fluctuations.', 'Customer Complaint', 'c1', 'In Progress', 'u2', 10, '2026-08-15', ''],
    ['capa2', 'Packaging Batch Redesign', 'Rectify sterile bag puncture issue detected in MedPack global delivery.', 'Inspection Failure', 'ins2', 'Open', 'u1', 5, '2026-08-20', '']
  ];
  const insertCapa = db.prepare('INSERT OR REPLACE INTO capas (id, title, description, source_type, source_id, status, assigned_to, aging_days, target_completion_date, completed_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  capas.forEach(c => insertCapa.run(c));
  insertCapa.finalize();

  // 10. Risks Seeding
  const risks = [
    ['r1', 'Supply Chain', 'Lead time spike due to sensor manufacturer customs delays.', 4, 3, 12, 'Diversify supply to European distributors.', 'Open'],
    ['r2', 'Quality', 'Aging inventory of Sterile packaging (expires Dec 2026).', 3, 4, 12, 'Expedite first-in-first-out usage workflow.', 'Open']
  ];
  const insertRisk = db.prepare('INSERT OR REPLACE INTO risks (id, category, description, likelihood, impact, score, mitigation_plan, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  risks.forEach(r => insertRisk.run(r));
  insertRisk.finalize();

  // 11. AI Recommendations Seeding
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
  const insertRec = db.prepare('INSERT OR REPLACE INTO ai_recommendations (id, type, target_entity_type, target_entity_id, recommendation_data, confidence_score, explanation, status, model_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  recs.forEach(r => insertRec.run(r));
  insertRec.finalize();

  // 12. Notifications Seeding
  const notifications = [
    ['n1', 'u1', 'Critical Safety Stock Alert', 'Oxygen Flow Sensor (SKU-SN-001) has dropped below safety stock!', 'Alert', 'High', 0, 'item', 'i1'],
    ['n2', 'u2', 'New AI Reorder Recommendation', 'Reorder 80 units of Oxygen Flow Sensor proposed.', 'Recommendation', 'Medium', 0, 'ai_recommendation', 'rec1'],
    ['n3', 'u1', 'CAPA Deadline Approaching', 'Packaging Batch Redesign CAPA is due in 15 days.', 'Action Required', 'Medium', 0, 'capa', 'capa2']
  ];
  const insertNotif = db.prepare('INSERT OR REPLACE INTO notifications (id, user_id, title, message, type, severity, is_read, related_entity_type, related_entity_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  notifications.forEach(n => insertNotif.run(n));
  insertNotif.finalize();

  console.log('Database seeded successfully.');
});

db.close();
