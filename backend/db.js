import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';

dotenv.config();

const dbPath = process.env.SQLITE_PATH || path.resolve(process.cwd(), 'data', 'database.sqlite');
const dbDir = path.dirname(dbPath);

console.log('Using SQLite DB at:', dbPath);

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

export const dbGet = async (sql, params = []) => {
  const db = await openDb();
  const row = await db.get(sql, params);
  await db.close();
  return row || null;
};

export const dbAll = async (sql, params = []) => {
  const db = await openDb();
  const rows = await db.all(sql, params);
  await db.close();
  return rows;
};

export const dbRun = async (sql, params = []) => {
  const db = await openDb();
  const result = await db.run(sql, params);
  await db.close();
  return result;
};
