// lib/storage.native.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { KVStore, StorageAPI } from './storage';

let ready: Promise<void> | null = null;
const stores: Record<string, KVStore> = {};

function makeStore(prefix: string): KVStore {
  const p = prefix.endsWith(':') ? prefix : `${prefix}:`;
  return {
    async getItem<T>(k)    { const v = await AsyncStorage.getItem(p + k); return v ? JSON.parse(v) as T : null; },
    async setItem<T>(k, v) { await AsyncStorage.setItem(p + k, JSON.stringify(v)); return v; },
    async removeItem(k)    { await AsyncStorage.removeItem(p + k); },
    async clear()          {
      const allKeys = await AsyncStorage.getAllKeys();
      const mine = allKeys.filter(k => k.startsWith(p));
      await AsyncStorage.multiRemove(mine);
    },
    async keys()           {
      const allKeys = await AsyncStorage.getAllKeys();
      return allKeys.filter(k => k.startsWith(p)).map(k => k.slice(p.length));
    },
    async iterate<T>(fn)   {
      const ks = await AsyncStorage.getAllKeys();
      const mine = ks.filter(k => k.startsWith(p));
      const pairs = await AsyncStorage.multiGet(mine);
      let i = 1;
      for (const [fullKey, raw] of pairs) {
        const key = fullKey.replace(p, '');
        const value = raw ? JSON.parse(raw) as T : null;
        if (value !== null) await fn(value, key, i++);
      }
    },
  };
}

export const initStorage: StorageAPI['initStorage'] = async () => {
  if (!ready) ready = Promise.resolve(); // nothing to init on native
  return ready;
};

export const getStore: StorageAPI['getStore'] = async (name) => {
  await (ready ?? initStorage());
  if (stores[name]) return stores[name];
  stores[name] = makeStore(`ai-dm-app:${name}`);
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

// Secure storage for sensitive data
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  }
};