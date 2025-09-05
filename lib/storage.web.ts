// lib/storage.web.ts
import localforage from 'localforage';
import type { KVStore, StorageAPI } from './storage.types';

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

function memoryStore(): KVStore {
  const m = new Map<string, unknown>();
  return {
    async getItem<T>(k)     { return (m.has(k) ? (m.get(k) as T) : null); },
    async setItem<T>(k, v)  { m.set(k, v); return v; },
    async removeItem(k)     { m.delete(k); },
    async clear()           { m.clear(); },
    async keys()            { return Array.from(m.keys()); },
    async iterate<T>(fn)    {
      let i = 1; for (const [k, v] of m) await fn(v as T, k, i++);
    },
  };
}

let ready: Promise<void> | null = null;
let usingMemory = false;
const stores: Record<string, KVStore> = {};

export const initStorage: StorageAPI['initStorage'] = (appName = 'ai-dm-app') => {
  if (ready) return ready;

  ready = (async () => {
    if (!isBrowser) { usingMemory = true; return; }

    localforage.config({
      name: appName,
      storeName: 'default',
      version: 1,
      description: 'AI DM web cache',
    });

    try {
      await localforage.setDriver([localforage.INDEXEDDB, localforage.LOCALSTORAGE]);
      await localforage.ready();
    } catch {
      usingMemory = true;
    }
  })();

  return ready;
};

export const getStore: StorageAPI['getStore'] = async (name) => {
  await (ready ?? initStorage());
  if (stores[name]) return stores[name];

  if (usingMemory || !isBrowser) {
    stores[name] = memoryStore();
    return stores[name];
  }

  const inst = localforage.createInstance({
    name: 'ai-dm-app',
    storeName: name,
    description: `AI DM store: ${name}`,
  });

  await inst.ready();

  stores[name] = {
    getItem:    inst.getItem.bind(inst),
    setItem:    inst.setItem.bind(inst),
    removeItem: inst.removeItem.bind(inst),
    clear:      inst.clear.bind(inst),
    keys:       inst.keys ? inst.keys.bind(inst) : async () => {
      const arr: string[] = [];
      await inst.iterate((_v, k) => { arr.push(String(k)); });
      return arr;
    },
    iterate:    inst.iterate.bind(inst),
  };

  return stores[name];
};

// Legacy storage utilities for backward compatibility
export const storage = {
  async getItem(key: string): Promise<string | null> {
    const store = await getStore('legacy');
    return await store.getItem<string>(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    const store = await getStore('legacy');
    await store.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    const store = await getStore('legacy');
    await store.removeItem(key);
  }
};

// Secure storage for sensitive data (keeping existing implementation)
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
};