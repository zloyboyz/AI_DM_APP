// lib/storage.ts
import localforage from 'localforage';

type KVStore = {
  getItem<T = unknown>(key: string): Promise<T | null>;
  setItem<T = unknown>(key: string, value: T): Promise<T>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  iterate<T = unknown>(fn: (value: T, key: string, i: number) => void): Promise<void>;
};

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
const drivers = [localforage.INDEXEDDB, localforage.LOCALSTORAGE];

function makeMemoryStore(): KVStore {
  const map = new Map<string, unknown>();
  return {
    async getItem<T>(k) { return (map.has(k) ? (map.get(k) as T) : null); },
    async setItem<T>(k, v) { map.set(k, v); return v; },
    async removeItem(k) { map.delete(k); },
    async clear() { map.clear(); },
    async keys() { return Array.from(map.keys()); },
    async iterate<T>(fn) {
      let i = 1;
      for (const [k, v] of map.entries()) fn(v as T, k, i++);
    },
  };
}

let ready: Promise<void> | null = null;
let usingMemory = false;
const stores: Record<string, KVStore> = {};

export function initStorage(appName = 'ai-dm-app') {
  if (ready) return ready;
  ready = (async () => {
    if (!isBrowser) { usingMemory = true; return; }
    localforage.config({ name: appName, storeName: 'default', version: 1, description: 'AI DM cache' });
    try {
      await localforage.setDriver(drivers);
      await localforage.ready();
    } catch {
      usingMemory = true; // e.g., storage blocked
    }
  })();
  return ready;
}

export async function getStore(name: string): Promise<KVStore> {
  await (ready ?? initStorage());
  if (stores[name]) return stores[name];

  if (usingMemory || !isBrowser) {
    stores[name] = makeMemoryStore();
    return stores[name];
  }

  const inst = localforage.createInstance({
    name: 'ai-dm-app',
    storeName: name,
    description: `AI DM store: ${name}`,
  });

  await inst.ready();

  stores[name] = {
    getItem: inst.getItem.bind(inst),
    setItem: inst.setItem.bind(inst),
    removeItem: inst.removeItem.bind(inst),
    clear: inst.clear.bind(inst),
    keys: inst.keys ? inst.keys.bind(inst) : async () => {
      const arr: string[] = [];
      await inst.iterate((_v, key) => arr.push(String(key)));
      return arr;
    },
    iterate: inst.iterate.bind(inst),
  };

  return stores[name];
}

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
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  }
};