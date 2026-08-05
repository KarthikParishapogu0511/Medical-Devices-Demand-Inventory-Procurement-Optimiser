import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

(async () => {
  const dbPath = process.env.SQLITE_PATH || path.resolve(process.cwd(), 'data', 'database.sqlite');
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  const rows = await db.all("SELECT name, type FROM sqlite_master WHERE type IN ('table','view') ORDER BY name");
  console.log('DB:', dbPath);
  console.table(rows);
  await db.close();
})();
