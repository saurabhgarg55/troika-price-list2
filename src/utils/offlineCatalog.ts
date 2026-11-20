import { Product } from '../types';

const DB_NAME = 'troika_catalog_db';
const DB_VERSION = 1;
const SNAPSHOT_STORE = 'catalog_snapshot';
const ITEMS_STORE = 'products';
const SNAPSHOT_KEY = 'primary_catalog_v1';
const LOCAL_FALLBACK_KEY = 'troika_catalog_fallback_v1';

export interface CatalogCacheStatus {
  source: 'indexeddb' | 'localstorage' | 'bundled';
  isCached: boolean;
  isPersisted: boolean;
  lastSyncedAt: number | null;
  itemCount: number;
}

interface CatalogSnapshotRecord {
  id: string;
  signature: string;
  products: Product[];
  updatedAt: number;
  itemCount: number;
}

function computeCatalogSignature(products: Product[]): string {
  if (!products.length) return '0';
  const first = products[0];
  const mid = products[Math.floor(products.length / 2)];
  const last = products[products.length - 1];
  return `${products.length}:${first?.code ?? ''}:${first?.price ?? ''}:${mid?.code ?? ''}:${mid?.price ?? ''}:${last?.code ?? ''}:${last?.price ?? ''}`;
}

function openCatalogDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
        db.createObjectStore(SNAPSHOT_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(ITEMS_STORE)) {
        const itemsStore = db.createObjectStore(ITEMS_STORE, { keyPath: 'storageKey' });
        itemsStore.createIndex('code', 'code', { unique: false });
        itemsStore.createIndex('name', 'name', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage) {
      if (navigator.storage.persisted) {
        const alreadyPersisted = await navigator.storage.persisted();
        if (alreadyPersisted) return true;
      }
      if (navigator.storage.persist) {
        return await navigator.storage.persist();
      }
    }
  } catch {
    // Ignore permission or browser restriction errors
  }
  return false;
}

async function readSnapshotFromIDB(): Promise<CatalogSnapshotRecord | null> {
  const db = await openCatalogDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(SNAPSHOT_STORE, 'readonly');
      const store = tx.objectStore(SNAPSHOT_STORE);
      const req = store.get(SNAPSHOT_KEY);

      req.onsuccess = () => {
        resolve((req.result as CatalogSnapshotRecord | undefined) ?? null);
      };
      req.onerror = () => reject(req.error || new Error('Failed to read catalog snapshot'));
      tx.oncomplete = () => db.close();
      tx.onerror = () => db.close();
    } catch (err) {
      db.close();
      reject(err);
    }
  });
}

async function writeSnapshotToIDB(snapshot: CatalogSnapshotRecord): Promise<void> {
  const db = await openCatalogDB();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction([SNAPSHOT_STORE, ITEMS_STORE], 'readwrite');
      const snapshotStore = tx.objectStore(SNAPSHOT_STORE);
      const itemsStore = tx.objectStore(ITEMS_STORE);

      snapshotStore.put(snapshot);
      itemsStore.clear();

      snapshot.products.forEach((product, idx) => {
        const storageKey = product.id || `${product.code}___${product.name}___${product.size || ''}___${idx}`;
        itemsStore.put({
          ...product,
          storageKey,
          searchText: `${product.code || ''} ${product.name || ''} ${product.category || ''}`.toLowerCase(),
        });
      });

      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        const err = tx.error || new Error('Failed to write catalog to IndexedDB');
        db.close();
        reject(err);
      };
    } catch (err) {
      db.close();
      reject(err);
    }
  });
}

function readLocalFallback(): CatalogSnapshotRecord | null {
  try {
    const raw = localStorage.getItem(LOCAL_FALLBACK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CatalogSnapshotRecord;
    if (parsed && Array.isArray(parsed.products)) {
      return parsed;
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

function writeLocalFallback(snapshot: CatalogSnapshotRecord): void {
  try {
    localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore quota or private mode errors
  }
}

export async function syncCatalogOfflineFirst(
  bundledProducts: Product[]
): Promise<{ products: Product[]; status: CatalogCacheStatus }> {
  const isPersisted = await requestPersistentStorage();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const bundledSignature = computeCatalogSignature(bundledProducts);

  try {
    const existing = await readSnapshotFromIDB();

    if (existing && Array.isArray(existing.products) && existing.products.length > 0) {
      if (!isOnline || existing.signature === bundledSignature) {
        return {
          products: existing.products,
          status: {
            source: 'indexeddb',
            isCached: true,
            isPersisted,
            lastSyncedAt: existing.updatedAt,
            itemCount: existing.products.length,
          },
        };
      }
    }

    const snapshot: CatalogSnapshotRecord = {
      id: SNAPSHOT_KEY,
      signature: bundledSignature,
      products: bundledProducts,
      updatedAt: Date.now(),
      itemCount: bundledProducts.length,
    };

    await writeSnapshotToIDB(snapshot);
    writeLocalFallback(snapshot);

    return {
      products: bundledProducts,
      status: {
        source: 'indexeddb',
        isCached: true,
        isPersisted,
        lastSyncedAt: snapshot.updatedAt,
        itemCount: bundledProducts.length,
      },
    };
  } catch {
    const fallback = readLocalFallback();
    if (fallback && fallback.products.length > 0 && (!isOnline || fallback.signature === bundledSignature)) {
      return {
        products: fallback.products,
        status: {
          source: 'localstorage',
          isCached: true,
          isPersisted,
          lastSyncedAt: fallback.updatedAt,
          itemCount: fallback.products.length,
        },
      };
    }

    const fallbackSnapshot: CatalogSnapshotRecord = {
      id: SNAPSHOT_KEY,
      signature: bundledSignature,
      products: bundledProducts,
      updatedAt: Date.now(),
      itemCount: bundledProducts.length,
    };
    writeLocalFallback(fallbackSnapshot);

    return {
      products: bundledProducts,
      status: {
        source: 'localstorage',
        isCached: true,
        isPersisted,
        lastSyncedAt: fallbackSnapshot.updatedAt,
        itemCount: bundledProducts.length,
      },
    };
  }
}
