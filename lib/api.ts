import { getSessionId } from './session';

export async function postJSON<T = any>(url: string, body: Record<string, any>): Promise<T> {
  const sessionId = await getSessionId();
  const payload = { ...body, sessionId }; // always send it if set

  const res = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'User-Agent': 'Expo-Mobile-App/1.0',
    },
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  
  const text = await res.text();
  const ct = res.headers.get('content-type') || '';
  
  if (!ct.includes('application/json') || !text.trim()) {
    // Return empty object if no JSON response
    return {} as T;
  }
  
  return JSON.parse(text) as T;
}