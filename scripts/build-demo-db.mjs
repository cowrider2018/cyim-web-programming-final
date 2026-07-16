/**
 * Builds the SQLite file the static demo ships with.
 *
 * The dev database in server/data is in WAL mode, so its committed rows can
 * still be sitting in the -wal sidecar; copying the .db alone would ship a
 * half-empty catalogue. This migrates and seeds a throwaway file, then uses
 * VACUUM INTO to emit a single self-contained snapshot with the default
 * journal mode — which is what sql.js can open in the browser.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const serverDir = join(root, 'server');
const scratch = join(serverDir, 'data', 'demo-build.db');
const output = join(root, 'web', 'public', 'demo.db');

const env = {
  ...process.env,
  DATABASE_URL: './data/demo-build.db',
  // The demo never mints a JWT — the session lives in the browser. env.ts still
  // validates this at import time, so it needs to be present and long enough.
  JWT_SECRET: process.env.JWT_SECRET ?? 'demo-build-secret-not-used-for-anything-real',
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD ?? 'admin1234',
  SEED_CUSTOMER_PASSWORD: process.env.SEED_CUSTOMER_PASSWORD ?? 'password1234',
};

function run(script) {
  execFileSync('npx', ['tsx', script], {
    cwd: serverDir,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
}

for (const suffix of ['', '-shm', '-wal']) rmSync(`${scratch}${suffix}`, { force: true });
mkdirSync(dirname(scratch), { recursive: true });
mkdirSync(dirname(output), { recursive: true });
rmSync(output, { force: true });

run('src/db/migrate.ts');
run('src/db/seed.ts');

const db = new Database(scratch, { readonly: true });
db.exec(`VACUUM INTO '${output.replace(/'/g, "''")}'`);
db.close();

for (const suffix of ['', '-shm', '-wal']) rmSync(`${scratch}${suffix}`, { force: true });

console.log(`Demo database written to ${output}`);
