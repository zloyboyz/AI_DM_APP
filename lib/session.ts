import { getItem, setItem, removeItem, storageName } from '../app/utils/storage';

const KEY = 'lastSessionId';

export async function getSessionId(): Promise<string | null> {
  const sessionId = await getItem(KEY);
  console.log('[session.ts] getSessionId() -> returning:', sessionId);
  console.log('[session.ts] storage backend:', storageName());
  return sessionId;
}

export async function setSessionId(value: string) {
  console.log('[session.ts] setSessionId() -> setting:', value);
  try {
    await setItem(KEY, value);
    console.log('[session.ts] setSessionId() -> stored successfully');
  } catch (error) {
    console.error('[session.ts] setSessionId() -> ERROR storing session ID:', error);
  }
}

export async function clearSessionId() {
  console.log('[session.ts] clearSessionId() -> clearing session');
  try {
    await removeItem(KEY);
    console.log('[session.ts] clearSessionId() -> cleared successfully');
  } catch (error) {
    console.error('[session.ts] clearSessionId() -> ERROR clearing session ID:', error);
  }
}