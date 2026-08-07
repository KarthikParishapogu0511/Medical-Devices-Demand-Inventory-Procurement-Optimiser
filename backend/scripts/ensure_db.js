import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const dbPath = process.env.SQLITE_PATH || path.resolve(process.cwd(), 'data', 'database.sqlite');

const needsDemandHistoryRepair = async () => {
  if (!fs.existsSync(dbPath) || fs.statSync(dbPath).size === 0) return false;

  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  try {
    const columns = await db.all('PRAGMA table_info("demand_history")');
    return columns.length > 0 && !columns.some((column) => column.name === 'date');
  } finally {
    await db.close();
  }
};

const syncDemoUserNames = async () => {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  try {
    const usersTable = await db.get("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'");
    if (!usersTable) return;

    const users = [
      ['u1', 'procurement_mgr@hospital.com', 'Priya', 'Sharma'],
      ['u2', 'inventory_planner@hospital.com', 'Arjun', 'Reddy'],
      ['u3', 'warehouse_user@hospital.com', 'Karthik', 'Nair'],
      ['u4', 'supplier_user@hospital.com', 'Meera', 'Iyer'],
      ['u5', 'finance_reviewer@hospital.com', 'Ananya', 'Gupta']
    ];

    for (const [id, email, firstName, lastName] of users) {
      await db.run(
        'UPDATE users SET first_name = ?, last_name = ? WHERE id = ? AND email = ?',
        [firstName, lastName, id, email]
      );
    }
    console.log('Demo user names are up to date.');
  } finally {
    await db.close();
  }
};

const run = async () => {
  const exists = fs.existsSync(dbPath) && fs.statSync(dbPath).size > 0;
  const repairRequired = exists && await needsDemandHistoryRepair();

  if (exists && !repairRequired) {
    await syncDemoUserNames();
    console.log('Database already exists at', dbPath);
    return;
  }

  console.log(repairRequired
    ? 'Repairing demand_history and importing missing data into'
    : 'Database missing; importing from medical.sql into', dbPath);
  const importer = spawn(process.execPath, ['scripts/import_medical_sql.js', 'medical.sql'], {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env
  });

  importer.on('close', async (code) => {
    if (code === 0) await syncDemoUserNames();
    process.exit(code === 0 ? 0 : 1);
  });
};

run().catch((error) => {
  console.error('Database check failed:', error.message);
  process.exit(1);
});
