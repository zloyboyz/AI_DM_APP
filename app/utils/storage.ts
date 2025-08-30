// app/utils/storage.ts
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

type Adapter = {
  name: string;
  ready: boolean;
  getItem: (k: string) => Promise<string | null>;
  setItem: (k: string, v: string) => Promise<void>;
  removeItem: (k: string) => Promise<void>;
};

// --- Web: localStorage ---
const localStorageAdapter: Adapter = {
  name: 'localStorage',
  get ready() {
    try {
      if (Platform.OS !== 'web') return false;
      if (typeof window === 'undefined' || !window.localStorage) return false;
      // sanity test write/remove
      window.localStorage.setItem('__probe__', '1');
      window.localStorage.removeItem('__probe__');
      return true;
    } catch {
      return false;
    }
  },
  async getItem(k) {
    return window.localStorage.getItem(k);
  },
  async setItem(k, v) {
    window.localStorage.setItem(k, v);
  },
  async removeItem(k) {
    window.localStorage.removeItem(k);
  },
};

// --- Native: SecureStore (preferred) ---
const secureAdapter: Adapter = {
  name: 'SecureStore',
  get ready() {
    return Platform.OS !== 'web' && !!SecureStore.isAvailableAsync;
  },
  async getItem(k) {
    try {
      return await SecureStore.getItemAsync(k);
    } catch {
      return null;
    }
  },
  async setItem(k, v) {
    await SecureStore.setItemAsync(k, v);
  },
  async removeItem(k) {
    await SecureStore.deleteItemAsync(k);
  },
};

// --- Native: AsyncStorage (fallback) ---
const asyncAdapter: Adapter = {
  name: 'AsyncStorage',
  get ready() {
    return Platform.OS !== 'web' && !!AsyncStorage;
  },
  async getItem(k) {
    return await AsyncStorage.getItem(k);
  },
  async setItem(k, v) {
    await AsyncStorage.setItem(k, v);
  },
  async removeItem(k) {
    await AsyncStorage.removeItem(k);
  },
};

// --- Final fallback: in-memory (does NOT persist) ---
const mem = new Map<string, string>();
const memoryAdapter: Adapter = {
  name: 'Memory',
  ready: true,
  async getItem(k) {
    return mem.has(k) ? mem.get(k)! : null;
  },
  async setItem(k, v) {
    mem.set(k, v);
  },
  async removeItem(k) {
    mem.delete(k);
  },
};

let chosen: Adapter | null = null;

function pick(): Adapter {
  if (chosen) return chosen;
  if (localStorageAdapter.ready) chosen = localStorageAdapter;
  else if (secureAdapter.ready) chosen = secureAdapter;
  else if (asyncAdapter.ready) chosen = asyncAdapter;
  else chosen = memoryAdapter;

  if (chosen === memoryAdapter) {
    console.warn(
      '[storage] Falling back to in-memory storage (no persistence). ' +
        'Install @react-native-async-storage/async-storage or expo-secure-store for native.'
    );
  }
  return chosen!;
}

export async function getItem(key: string) {
  return pick().getItem(key);
}
export async function setItem(key: string, val: string) {
  return pick().setItem(key, val);
}
export async function removeItem(key: string) {
  return pick().removeItem(key);
}
export function storageName() {
  return pick().name;
}