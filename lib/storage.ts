// lib/storage.ts
import localforage from "localforage";
import * as asyncStorageDriver from "localforage-asyncstorage";

// Configure localforage to use AsyncStorage driver for React Native
localforage.defineDriver(asyncStorageDriver);
localforage.setDriver([
  asyncStorageDriver._driver,
  localforage.INDEXEDDB,
  localforage.WEBSQL,
  localforage.LOCALSTORAGE
]);

export type AudioRef = {
  path: string;           // "TestChat/<session>/<message>/narrator_01.mp3"
  public_url: string;     // from your n8n payload
  voice?: string;
  mime?: string;
  duration_ms?: number;
};

export type ChatMessage = {
  id: string;             // messageId
  role: "user" | "dm";
  text: string;
  audio?: AudioRef[];
  ts: number;
};

const chatDB  = localforage.createInstance({ name: "aidm", storeName: "chats"  });
const audioDB = localforage.createInstance({ name: "aidm", storeName: "audio"  });
const metaDB  = localforage.createInstance({ name: "aidm", storeName: "meta"   });

/** ---------- Chat (array of messages per session) ---------- */
export async function loadChat(sessionId: string): Promise<ChatMessage[]> {
  return (await chatDB.getItem<ChatMessage[]>(sessionId)) ?? [];
}

export async function saveChat(sessionId: string, msgs: ChatMessage[]) {
  await chatDB.setItem(sessionId, msgs);
}

export async function appendChat(sessionId: string, msg: ChatMessage) {
  const arr = await loadChat(sessionId);
  arr.push(msg);
  await saveChat(sessionId, arr);
}

export async function clearChat(sessionId: string) {
  await chatDB.removeItem(sessionId);
}

/** ---------- Audio cache ---------- */
const TTL_DAYS = 14;

function keyForAudio(sessionId: string, path: string) {
  return `${sessionId}:${path}`;
}

export async function cacheAudioBlob(sessionId: string, a: AudioRef) {
  try {
    const res  = await fetch(a.public_url, { cache: "no-store" });
    if (!res.ok) throw new Error(`fetch ${a.public_url} -> ${res.status}`);
    const blob = await res.blob();
    await audioDB.setItem(keyForAudio(sessionId, a.path), blob);
    // store last-used timestamp for cleanup
    await metaDB.setItem(`${keyForAudio(sessionId, a.path)}:ts`, Date.now());
  } catch (e) {
    console.warn("cacheAudioBlob failed:", e);
  }
}

export async function getPlayableUrl(sessionId: string, a: AudioRef): Promise<string> {
  const blob = await audioDB.getItem<Blob>(keyForAudio(sessionId, a.path));
  if (blob) {
    await metaDB.setItem(`${keyForAudio(sessionId, a.path)}:ts`, Date.now());
    return URL.createObjectURL(blob); // remember to revoke when unmounting UI
  }
  return a.public_url;
}

/** ---------- Optional: TTL cleanup on startup ---------- */
export async function vacuumOldAudio(now = Date.now()) {
  const ttlMs = TTL_DAYS * 24 * 60 * 60 * 1000;
  const keys = await audioDB.keys();
  for (const k of keys) {
    const ts = (await metaDB.getItem<number>(`${k}:ts`)) ?? now;
    if (now - ts > ttlMs) {
      await audioDB.removeItem(k);
      await metaDB.removeItem(`${k}:ts`);
    }
  }
}

/** ---------- Remember last sessionId locally ---------- */
const LAST_SESSION_KEY = "aidm:lastSessionId";
export function rememberSession(id: string) {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(LAST_SESSION_KEY, id);
  }
}

export function readLastSession(): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem(LAST_SESSION_KEY);
  }
  return null;
}