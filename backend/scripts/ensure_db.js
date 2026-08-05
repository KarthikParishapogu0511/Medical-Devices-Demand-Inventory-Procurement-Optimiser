import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const dbPath = process.env.SQLITE_PATH || path.resolve(process.cwd(), 'data', 'database.sqlite');

if (fs.existsSync(dbPath) && fs.statSync(dbPath).size > 0) {
  console.log('Database already exists at', dbPath);
  process.exit(0);
}

console.log('Database missing; importing from medical.sql into', dbPath);
const importer = spawn(process.execPath, ['scripts/import_medical_sql.js', 'medical.sql'], { stdio: 'inherit', cwd: process.cwd(), env: process.env });

importer.on('close', (code) => {
  process.exit(code === 0 ? 0 : 1);
});
