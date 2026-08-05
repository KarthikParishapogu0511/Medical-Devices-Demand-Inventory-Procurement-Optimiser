import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

// Usage: node scripts/import_medical_sql.js ../medical.sql
const sqlFile = process.argv[2] || path.resolve('./medical.sql');
const dbPath = process.env.SQLITE_PATH || path.resolve('./data/database.sqlite');

if (!fs.existsSync(sqlFile)) {
  console.error('SQL file not found:', sqlFile);
  process.exit(1);
}

const normalizeCreate = (line) => {
  // remove schema qualifiers
  line = line.replace(/CREATE TABLE public\./i, 'CREATE TABLE IF NOT EXISTS ');
  // remove type casts like '::text'
  line = line.replace(/::[a-zA-Z_]+/g, '');
  // replace numeric/real with REAL
  line = line.replace(/\bnumeric\b/gi, 'REAL').replace(/\breal\b/gi, 'REAL');
  // replace timestamp without time zone -> TEXT
  line = line.replace(/timestamp without time zone/gi, 'TEXT').replace(/timestamp with(out)? time zone/gi, 'TEXT');
  // date -> TEXT
  line = line.replace(/\bdate\b/gi, 'TEXT');
  // boolean -> INTEGER
  line = line.replace(/\bboolean\b/gi, 'INTEGER');
  // DEFAULT CURRENT_TIMESTAMP keep as CURRENT_TIMESTAMP (SQLite supports it)
  return line;
};

(async () => {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  await db.exec("PRAGMA foreign_keys=OFF;");
  await db.exec("BEGIN TRANSACTION;");

  const rl = readline.createInterface({ input: fs.createReadStream(sqlFile), crlfDelay: Infinity });

  let inCopy = false;
  let copyTable = null;
  let copyCols = [];
  let pendingInserts = 0;

  for await (const rawLine of rl) {
    let line = rawLine.trimEnd();
    if (!inCopy) {
      if (line.startsWith('--') || line.startsWith('SET ') || line.startsWith('SELECT ') || line.startsWith('ALTER TABLE') || line.length === 0) {
        continue;
      }

      if (/^CREATE TABLE public\./i.test(line)) {
        // collect until closing ');'
        let createStmt = line;
        while (!createStmt.includes(');')) {
          const next = await rl[Symbol.asyncIterator]().next();
          if (next.done) break;
          createStmt += '\n' + next.value;
        }
        const fixed = normalizeCreate(createStmt);
        try {
          await db.exec(fixed);
        } catch (e) {
          console.error('CREATE TABLE error:', e.message);
          console.error('SQL:', fixed.substring(0,200));
        }
        continue;
      }

      const copyMatch = line.match(/^COPY\s+public\.([a-z0-9_]+)\s*\(([^)]+)\)\s+FROM\s+stdin;/i);
      if (copyMatch) {
        inCopy = true;
        copyTable = copyMatch[1];
        copyCols = copyMatch[2].split(',').map(s => s.trim().replace(/\"/g, ''));
        continue;
      }

      // other SQL like CREATE INDEX, etc. skip if unsupported
      if (/^CREATE INDEX|^ALTER TABLE|^COMMENT ON|^GRANT|^REVOKE/i.test(line)) continue;

      // If it's an INSERT from dump (unlikely), try to run after minor fixes
      if (/^INSERT INTO/i.test(line) || /^CREATE TABLE/i.test(line)) {
        const fixed = normalizeCreate(line);
        try { await db.exec(fixed); } catch (e) { /* ignore */ }
        continue;
      }

    } else {
      if (line === '\\.') {
        inCopy = false;
        copyTable = null;
        copyCols = [];
        continue;
      }
      // parse tab-separated row
      // Values are tab separated, nulls as \N
      const parts = line.split('\t');
      // convert \N -> null, unescape
      const vals = parts.map(v => v === '\\N' ? null : (v === '' ? null : v));
      // prepare placeholders
      const placeholders = vals.map(() => '?').join(',');
      const colsList = copyCols.map(c => `"${c}"`).join(',');
      const insertSql = `INSERT INTO "${copyTable}" (${colsList}) VALUES (${placeholders});`;
      try {
        await db.run(insertSql, vals);
        pendingInserts++;
        if (pendingInserts % 1000 === 0) process.stdout.write(`Inserted ${pendingInserts}\r`);
      } catch (e) {
        console.error(`Insert error into ${copyTable}:`, e.message);
        console.error('SQL:', insertSql, 'VALS:', vals.slice(0,5));
      }
      continue;
    }
  }

  await db.exec('COMMIT;');
  await db.exec("PRAGMA foreign_keys=ON;");
  await db.close();
  console.log('\nImport complete.');
})();
