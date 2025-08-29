import { sessionDB } from './storage';

export async function getSessionId(): Promise<string | null> {
  const sessionId = await sessionDB.getItem<string>('lastSessionId');
  console.log('[session.ts] getSessionId() -> returning:', sessionId);
  return sessionId;
}

export async function setSessionId(value: string) {
  console.log('[session.ts] setSessionId() -> setting:', value);
  await sessionDB.setItem('lastSessionId', value);
  console.log('[session.ts] setSessionId() -> stored successfully');
}

export async function clearSessionId() {
  console.log('[session.ts] clearSessionId() -> clearing session');
  await sessionDB.removeItem('lastSessionId');
  console.log('[session.ts] clearSessionId() -> cleared successfully');
}