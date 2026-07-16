/**
 * Durable storage for the demo database.
 *
 * sql.js keeps the whole database in WASM memory, so without this every reload
 * would wipe the visitor's orders and account. The export is a plain byte array
 * — IndexedDB stores it as-is, where localStorage would force a base64 round
 * trip and cap out around 5MB.
 */
const DB_NAME = 'maisie-demo';
const STORE = 'sqlite';
const KEY = 'db';

/**
 * Bump when the schema or seed changes. A returning visitor holds a snapshot
 * taken against the old shape, and restoring it into new code would fail in
 * ways that look like random bugs; a mismatch discards it and reseeds instead.
 */
const SNAPSHOT_VERSION = 1;

interface Snapshot {
  version: number;
  bytes: Uint8Array;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transact<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return open().then(
    (idb) =>
      new Promise<T>((resolve, reject) => {
        const tx = idb.transaction(STORE, mode);
        const request = run(tx.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => idb.close();
      }),
  );
}

/** Returns the saved snapshot, or null on a first visit, a cleared store, or a
 * snapshot left behind by an older build. */
export async function loadSnapshot(): Promise<Uint8Array | null> {
  try {
    const saved = await transact<Snapshot | undefined>('readonly', (store) =>
      store.get(KEY),
    );
    if (!saved || saved.version !== SNAPSHOT_VERSION) return null;
    return saved.bytes;
  } catch {
    // Private browsing can refuse IndexedDB outright. The demo still works, it
    // just restarts from the seed on every reload.
    return null;
  }
}

export async function saveSnapshot(bytes: Uint8Array): Promise<void> {
  try {
    const snapshot: Snapshot = { version: SNAPSHOT_VERSION, bytes };
    await transact('readwrite', (store) => store.put(snapshot, KEY));
  } catch {
    // Ignore: a demo that can't persist is still a working demo.
  }
}

export async function clearSnapshot(): Promise<void> {
  try {
    await transact('readwrite', (store) => store.delete(KEY));
  } catch {
    // Ignore.
  }
}
