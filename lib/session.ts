import { getStore } from './storage';

const KEY = 'lastSessionId';

export async function getSessionId(): Promise<string | null> {
  const store = await getStore('session');
  const sessionId = await store.getItem<string>(KEY);
  console.log('[session.ts] getSessionId() -> returning:', sessionId);
  console.log('[session.ts] storage backend: getStore');
  return sessionId;
}

export async function setSessionId(value: string) {
  console.log('[session.ts] setSessionId() -> setting:', value);
  try {
    const store = await getStore('session');
    await store.setItem(KEY, value);
    console.log('[session.ts] setSessionId() -> stored successfully');
  } catch (error) {
    console.error('[session.ts] setSessionId() -> ERROR storing session ID:', error);
  }
}

export async function clearSessionId() {
  console.log('[session.ts] clearSessionId() -> clearing session');
  try {
    const store = await getStore('session');
    await store.removeItem(KEY);
    console.log('[session.ts] clearSessionId() -> cleared successfully');
  } catch (error) {
    console.error('[session.ts] clearSessionId() -> ERROR clearing session ID:', error);
  }
}