/**
 * The database, for the static demo.
 *
 * This module stands in for server/src/db/client.ts — see the swap plugin in
 * vite.config.ts. Everything above it (the schema, and every service in
 * server/src/modules) imports `db` from here and is reused verbatim: the real
 * queries, the real transactions, the real business rules, against a real
 * SQLite engine compiled to WASM. Only the engine's host changes.
 *
 * The top-level await matters. Services build query fragments at module scope
 * (catalog.service.ts does this for its rating and image subqueries), so `db`
 * has to be a live Drizzle instance the moment this module is imported — a
 * promise or a lazy getter would break them.
 */
import { drizzle } from 'drizzle-orm/sql-js';
import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import * as schema from '@server/db/schema.js';
import { clearSnapshot, loadSnapshot, saveSnapshot } from './storage';

const SQL = await initSqlJs({ locateFile: () => wasmUrl });

async function fetchSeed(): Promise<Uint8Array> {
  const response = await fetch(`${import.meta.env.BASE_URL}demo.db`);
  if (!response.ok) {
    throw new Error(
      `Could not load the demo database (${response.status}). ` +
        'Run `npm run build:demo-db` if this is a local build.',
    );
  }
  return new Uint8Array(await response.arrayBuffer());
}

export const sqlite = new SQL.Database((await loadSnapshot()) ?? (await fetchSeed()));

// SQLite leaves foreign keys off unless a connection asks for them, and the
// order/stock rules lean on the constraints being live.
sqlite.run('PRAGMA foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

export type DB = typeof db;
export { schema };

let pending: number | undefined;

/**
 * Writes the database back to IndexedDB, coalescing bursts. Checkout fires
 * several statements inside one transaction; this snapshots once after they
 * settle rather than serialising the whole file per statement.
 */
export function persist(): void {
  if (pending !== undefined) clearTimeout(pending);
  pending = setTimeout(() => {
    pending = undefined;
    void saveSnapshot(sqlite.export());
  }, 150) as unknown as number;
}

/** Drops the visitor's changes and reloads into a freshly seeded catalogue. */
export async function resetDemo(): Promise<void> {
  await clearSnapshot();
  window.location.reload();
}
