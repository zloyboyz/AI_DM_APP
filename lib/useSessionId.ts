import { useEffect, useState } from 'react';
import { getSessionId, setSessionId } from './session';

export function useSessionId() {
  const [sessionId, setId] = useState<string | null>(() => getSessionId());

  useEffect(() => {
    // ensures state is hydrated on mount even if module cache was empty
    setId(getSessionId());
  }, []);

  const update = (v: string) => {
    setSessionId(v);
    setId(v);
  };

  return { sessionId, setSessionId: update };
}