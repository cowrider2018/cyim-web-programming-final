import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { env } from '../env.js';
import * as schema from './schema.js';

const dbPath = resolve(process.cwd(), env.DATABASE_URL);
mkdirSync(dirname(dbPath), { recursive: true });

export const sqlite = new Database(dbPath);

// WAL lets readers run alongside a writer; foreign_keys is off by default in
// SQLite and must be enabled per connection or the FK constraints are inert.
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('busy_timeout = 5000');

export const db = drizzle(sqlite, { schema });

export type DB = typeof db;
export { schema };
