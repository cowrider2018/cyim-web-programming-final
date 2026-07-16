import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { env } from '../env.js';

const dbPath = resolve(process.cwd(), env.DATABASE_URL);

for (const suffix of ['', '-shm', '-wal']) {
  rmSync(`${dbPath}${suffix}`, { force: true });
}

console.log(`Removed ${dbPath}. Run "npm run db:migrate && npm run db:seed" to rebuild.`);
