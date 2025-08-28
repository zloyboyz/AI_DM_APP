import { sessionDB } from './storage';

export async function getSessionId(): Promise<string | null> {
  return await sessionDB.getItem<string>('lastSessionId');
}

export async function setSessionId(value: string) {
  await sessionDB.setItem('lastSessionId', value);
}

export async function clearSessionId() {
  await sessionDB.removeItem('lastSessionId');
}