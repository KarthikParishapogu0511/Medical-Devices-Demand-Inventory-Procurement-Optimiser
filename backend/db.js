import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required in the environment');
}

const normalizeParams = (text, params = []) => {
  let index = 0;
  const normalizedText = text.replace(/\?/g, () => `$${++index}`);
  return { text: normalizedText, params };
};

export const pool = new Pool({ connectionString });

export const dbGet = async (sql, params = []) => {
  const normalized = normalizeParams(sql, params);
  const result = await pool.query(normalized.text, normalized.params);
  return result.rows[0] || null;
};

export const dbAll = async (sql, params = []) => {
  const normalized = normalizeParams(sql, params);
  const result = await pool.query(normalized.text, normalized.params);
  return result.rows;
};

export const dbRun = async (sql, params = []) => {
  const normalized = normalizeParams(sql, params);
  return pool.query(normalized.text, normalized.params);
};
