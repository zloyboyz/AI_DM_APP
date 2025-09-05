import { useEffect } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

function useFrameworkReady() {
  useEffect(() => {
    // Only call frameworkReady on web platform
    if (typeof window !== 'undefined' && window.frameworkReady) {
      window.frameworkReady();
    }
  }, []);
  
  // Always return true for mobile platforms since they don't need frameworkReady
  return typeof window === 'undefined' || true;
}

export default useFrameworkReady;
export { useFrameworkReady };