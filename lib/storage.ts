// lib/storage.ts
export type KVStore = {
  getItem<T = unknown>(key: string): Promise<T | null>;
  setItem<T = unknown>(key: string, value: T): Promise<T>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  iterate<T = unknown>(
    fn: (value: T, key: string, i: number) => void | Promise<void>
  ): Promise<void>;
};

export type StorageAPI = {
  /** one-time init; safe to call many times */
  initStorage(appName?: string): Promise<void>;
  /** returns a named store after init is complete */
  getStore(name: string): Promise<KVStore>;
};

// NOTE: The actual implementation is selected by Metro via platform files:
export * from './storage.web';   // resolved on web
// export * from './storage.native'; // resolved on iOS/Android