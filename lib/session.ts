import { sessionDB } from './storage';

export async function getSessionId(): Promise<string | null> {
  const sessionId = await sessionDB.getItem<string>('lastSessionId');
  console.log('[session.ts] getSessionId() -> returning:', sessionId);
  return sessionId;
}

export async function setSessionId(value: string) {
  console.log('[session.ts] setSessionId() -> setting:', value);
  try {
    await sessionDB.setItem('lastSessionId', value);
    console.log('[session.ts] setSessionId() -> stored successfully');
  } catch (error) {
    console.error('[session.ts] setSessionId() -> ERROR storing session ID:', error);
  }
}

export async function clearSessionId() {
  console.log('[session.ts] clearSessionId() -> clearing session');
  try {
    const sessionId = await sessionDB.getItem<string>('lastSessionId');
    console.log('[session.ts] getSessionId() -> returning:', sessionId);
    return sessionId;
  } catch (error) {
    console.error('[session.ts] getSessionId() -> ERROR retrieving session ID:', error);
    return null;
  }
}