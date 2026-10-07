import { useEffect, useState } from 'react';

// Seconds left until `expiresAt` (ms timestamp). null when no hold.
export function useCountdown(expiresAt) {
  const calc = () => (expiresAt ? Math.max(0, Math.round((expiresAt - Date.now()) / 1000)) : null);
  const [left, setLeft] = useState(calc);

  useEffect(() => {
    setLeft(calc());
    if (!expiresAt) return;
    const t = setInterval(() => setLeft(calc()), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  return left;
}

export const mmss = (s) =>
  s == null ? '--:--' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;