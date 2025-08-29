import { useEffect, useState } from 'react';
import { getSessionId, setSessionId } from './session';
import { v4 as uuidv4 } from 'uuid';

export function useSessionId() {
  const [sessionId, setId] = useState<string | null>(null);

  useEffect(() => {
    console.log('[useSessionId] useEffect triggered - loading session ID');
    // Load session ID asynchronously
    const loadSessionId = async () => {
      let id = await getSessionId();
      console.log('[useSessionId] loadSessionId() -> got from storage:', id);
      
      // If no session ID exists, generate a new one
      if (!id) {
        id = uuidv4();
        console.log('[useSessionId] loadSessionId() -> generated new ID:', id);
        await setSessionId(id);
        console.log('[useSessionId] loadSessionId() -> saved new ID to storage');
      }
      
      console.log('[useSessionId] loadSessionId() -> setting state to:', id);
      setId(id);
    };
    loadSessionId();
  }, []);

  const update = async (v: string) => {
    console.log('[useSessionId] update() -> updating to:', v);
    await setSessionId(v);
    console.log('[useSessionId] update() -> saved to storage, updating state');
    setId(v);
    console.log('[useSessionId] update() -> state updated');
  };

  return { sessionId, setSessionId: update };
}