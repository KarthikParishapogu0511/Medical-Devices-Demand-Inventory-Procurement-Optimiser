import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

(async () => {
  const dbPath = process.env.SQLITE_PATH || path.resolve(process.cwd(), 'data', 'database.sqlite');
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  try {
    const u = await db.get('SELECT COUNT(*) as c FROM users');
    const items = await db.get('SELECT COUNT(*) as c FROM items');
    console.log('DB:', dbPath);
    console.log('users:', u ? u.c : 0);
    console.log('items:', items ? items.c : 0);
    const sampleUser = await db.get('SELECT id,email,role FROM users LIMIT 1');
    console.log('sample user:', sampleUser);
  } catch (err) {
    console.error('DB check error:', err.message);
    process.exit(1);
  } finally {
    await db.close();
    process.exit(0);
  }
})();
