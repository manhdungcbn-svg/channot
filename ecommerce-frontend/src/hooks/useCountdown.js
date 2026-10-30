import { useEffect, useMemo, useState } from 'react';

/**
 * Đếm ngược tới một mốc thời gian.
 * @param {string|number|Date} target - thời điểm kết thúc
 * @returns {{days: number, hours: number, minutes: number, seconds: number, total: number, expired: boolean}}
 */
export function useCountdown(target) {
  const targetTime = useMemo(() => {
    if (!target) return 0;
    const d = new Date(target).getTime();
    return Number.isNaN(d) ? 0 : d;
  }, [target]);

  const compute = () => {
    const diff = Math.max(0, targetTime - Date.now());
    return {
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff / 3_600_000) % 24),
      minutes: Math.floor((diff / 60_000) % 60),
      seconds: Math.floor((diff / 1_000) % 60),
      total: diff,
      expired: diff === 0,
    };
  };

  const [state, setState] = useState(compute);

  useEffect(() => {
    setState(compute());
    const timer = setInterval(() => setState(compute()), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetTime]);

  return state;
}

export default useCountdown;
