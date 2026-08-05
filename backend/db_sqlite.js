import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

dotenv.config();

const dbPath = process.env.SQLITE_PATH || './backend/data/database.sqlite';

export const openDb = async () => {
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
};

const normalizeParams = (text, params = []) => ({ text, params });

export const dbGet = async (sql, params = []) => {
  const db = await openDb();
  const result = await db.get(sql, params);
  await db.close();
  return result || null;
};

export const dbAll = async (sql, params = []) => {
  const db = await openDb();
  const result = await db.all(sql, params);
  await db.close();
  return result;
};

export const dbRun = async (sql, params = []) => {
  const db = await openDb();
  const result = await db.run(sql, params);
  await db.close();
  return result;
};
