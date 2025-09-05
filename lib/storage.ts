// lib/storage.ts
import localforage from 'localforage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type KVStore = {
  getItem<T = unknown>(key: string): Promise<T | null>;
  setItem<T = unknown>(key: string, value: T): Promise<T>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  iterate<T = unknown>(fn: (value: T, key: string, i: number) => void): Promise<void>;
};

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
const webDrivers = [localforage.INDEXEDDB, localforage.LOCALSTORAGE];

// Define AsyncStorage driver for React Native
const ASYNCSTORAGE_DRIVER = 'asyncStorageWrapper';

const asyncStorageDriver = {
  _driver: ASYNCSTORAGE_DRIVER,
  _initStorage: function() {
    return Promise.resolve();
  },
  _support: function() {
    return typeof AsyncStorage !== 'undefined';
  },
  _setItem: function(key: string, value: any) {
    return AsyncStorage.setItem(key, JSON.stringify(value));
  },
  _getItem: function(key: string) {
    return AsyncStorage.getItem(key).then(value => {
      if (value === null) return null;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    });
  },
  _removeItem: function(key: string) {
    return AsyncStorage.removeItem(key);
  },
  _clear: function() {
    return AsyncStorage.clear();
  },
  _key: function(n: number) {
    return AsyncStorage.getAllKeys().then(keys => keys[n] || null);
  },
  _keys: function() {
    return AsyncStorage.getAllKeys();
  },
  _length: function() {
    return AsyncStorage.getAllKeys().then(keys => keys.length);
  },
  _iterate: function(iterator: (value: any, key: string, iterationNumber: number) => any) {
    return AsyncStorage.getAllKeys().then(keys => {
      const promises = keys.map((key, index) => 
        AsyncStorage.getItem(key).then(value => {
          if (value !== null) {
            try {
              const parsedValue = JSON.parse(value);
              return iterator(parsedValue, key, index + 1);
            } catch {
              return iterator(value, key, index + 1);
            }
          }
        })
      );
      return Promise.all(promises);
    });
  }
};

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
    localforage.config({ name: appName, storeName: 'default', version: 1, description: 'AI DM cache' });
    try {
      if (Platform.OS === 'web') {
        await localforage.setDriver(webDrivers);
      } else {
        // Define and use AsyncStorage driver for React Native
        localforage.defineDriver(asyncStorageDriver);
        await localforage.setDriver(ASYNCSTORAGE_DRIVER);
      }
      await localforage.ready();
    } catch (error) {
      console.warn('Storage initialization failed, falling back to memory:', error);
      usingMemory = true; // e.g., storage blocked
    }
  })();
  return ready;
}

export async function getStore(name: string): Promise<KVStore> {
  await (ready ?? initStorage());
  if (stores[name]) return stores[name];

  if (usingMemory || !isBrowser) {
    // Only use memory store if we're not in browser AND storage init failed
    if (usingMemory) {
      stores[name] = makeMemoryStore();
      return stores[name];
    }
  }

  if (usingMemory) {
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