import { useEffect, useState } from 'react';
import { getSessionId, setSessionId } from './session';
import { v4 as uuidv4 } from 'uuid';

export function useSessionId() {
  const [sessionId, setId] = useState<string | null>(null);

  useEffect(() => {
    // Load session ID asynchronously
    const loadSessionId = async () => {
      let id = await getSessionId();
      
      // If no session ID exists, generate a new one
      if (!id) {
        id = uuidv4();
        await setSessionId(id);
      }
      
      setId(id);
    };
    loadSessionId();
  }, []);

  const update = async (v: string) => {
    await setSessionId(v);
    setId(v);
  };

  return { sessionId, setSessionId: update };
}