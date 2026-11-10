import { useEffect } from 'react';

let lockCount = 0;

// Adds body.locked while any modal/overlay is active (ref-counted).
export function useBodyLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lockCount++;
    document.body.classList.add('locked');
    return () => {
      lockCount--;
      if (lockCount <= 0) {
        lockCount = 0;
        document.body.classList.remove('locked');
      }
    };
  }, [active]);
}
