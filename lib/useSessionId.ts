import { useEffect, useState } from 'react';
import { getSessionId, setSessionId } from './session';

export function useSessionId() {
  const [sessionId, setId] = useState<string | null>(null);

  useEffect(() => {
    // Load session ID asynchronously
    const loadSessionId = async () => {
      const id = await getSessionId();
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