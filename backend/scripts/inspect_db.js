import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

(async () => {
  const dbPath = path.resolve(process.cwd(), 'data', 'database.sqlite');
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  console.log('DB path:', dbPath);
  const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  for (const { name } of tables) {
    const count = await db.get(`SELECT COUNT(*) as c FROM "${name}"`);
    console.log(`${name}: ${count.c}`);
  }
  console.log('--- sample users ---');
  const users = await db.all('SELECT id,email,role,first_name,last_name,status FROM users LIMIT 5');
  console.table(users);
  console.log('--- sample items ---');
  const items = await db.all('SELECT id,name,sku,category,current_stock,safety_stock,location FROM items LIMIT 5');
  console.table(items);
  await db.close();
})();
