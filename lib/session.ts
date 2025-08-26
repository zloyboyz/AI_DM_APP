import { rememberSession, readLastSession } from './storage';

export function getSessionId(): string | null {
  return readLastSession();
}

export function setSessionId(value: string) {
  rememberSession(value);
}

export function clearSessionId() {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('aidm:lastSessionId');
  }
}