import { useCallback, useEffect, useState } from 'react';

/**
 * Theo dõi media query, cập nhật khi match thay đổi.
 * @param {string} query
 * @returns {boolean}
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mql = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);
    setMatches(mql.matches);

    if (mql.addEventListener) {
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }, [query]);

  return matches;
}

export default useMediaQuery;
