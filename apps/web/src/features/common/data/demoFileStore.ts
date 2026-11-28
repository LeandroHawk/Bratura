/**
 * Keeps the bytes of the files the demo attaches (profile photo, event photos and videos, scanned
 * papers) in this browser's IndexedDB, keyed by `AttachedFile.storageKey`, until Convex storage
 * holds them. `demoStore.ts` decides when a file goes: replaced, removed, or at sign-out.
 */
const DATABASE_NAME = 'bratura.demo.files';
const STORE_NAME = 'files';

let database: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  database ??= new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB unavailable'));
  });
  database.catch(() => {
    database = null;
  });
  return database;
}

async function inStore<Result>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<Result> | void,
): Promise<Result | undefined> {
  const opened = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = opened.transaction(STORE_NAME, mode);
    const request = run(transaction.objectStore(STORE_NAME));
    transaction.oncomplete = () => resolve(request ? request.result : undefined);
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB aborted'));
  });
}

/** Keeps the bytes and answers the key that finds them; rejects when the browser refuses. */
export async function keepAttachedFileBytes(file: Blob): Promise<string> {
  const storageKey = crypto.randomUUID();
  await inStore('readwrite', (store) => store.put(file, storageKey));
  return storageKey;
}

/** The bytes under the key, or `null` when they are gone (another browser, storage cleared). */
export async function attachedFileBytesFromStorageKey(storageKey: string): Promise<Blob | null> {
  const found = await inStore<unknown>('readonly', (store) => store.get(storageKey));
  return found instanceof Blob ? found : null;
}

/** Erases the bytes under each key; a failure leaves them until the next sign-out. */
export function forgetAttachedFileBytes(storageKeys: readonly string[]) {
  if (storageKeys.length === 0 || typeof window === 'undefined' || !window.indexedDB) return;
  void inStore('readwrite', (store) => storageKeys.forEach((key) => store.delete(key))).catch(
    () => {},
  );
}

/** Erases every kept file: the account they belonged to is gone. */
export function forgetEveryAttachedFileBytes() {
  if (typeof window === 'undefined' || !window.indexedDB) return;
  void inStore('readwrite', (store) => store.clear()).catch(() => {});
}
