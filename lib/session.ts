const KEY = 'sessionId';

// in-memory cache for this JS runtime/tab
let memorySessionId: string | null = null;

export function getSessionId(): string | null {
  if (memorySessionId !== null) return memorySessionId;
  
  // Check if we're in a web environment
  if (typeof window !== 'undefined' && window.sessionStorage) {
    // hydrate from sessionStorage on first access
    memorySessionId = sessionStorage.getItem(KEY);
  }
  
  return memorySessionId;
}

export function setSessionId(value: string) {
  memorySessionId = value;
  
  // Only use sessionStorage in web environment
  if (typeof window !== 'undefined' && window.sessionStorage) {
    sessionStorage.setItem(KEY, value);
  }
}

export function clearSessionId() {
  memorySessionId = null;
  
  // Only use sessionStorage in web environment
  if (typeof window !== 'undefined' && window.sessionStorage) {
    sessionStorage.removeItem(KEY);
  }
}