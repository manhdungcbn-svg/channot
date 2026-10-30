import { useEffect, useState } from 'react';

/**
 * True nếu người dùng yêu cầu giảm chuyển động (prefers-reduced-motion).
 * @returns {boolean}
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (event) => setReduced(event.matches);
    setReduced(mql.matches);

    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }, []);

  return reduced;
}

export default useReducedMotion;
