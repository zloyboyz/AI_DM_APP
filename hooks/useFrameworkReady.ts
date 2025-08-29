import { useEffect } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

function useFrameworkReady() {
  useEffect(() => {
    window.frameworkReady?.()
  })
}

export default useFrameworkReady;
export { useFrameworkReady };