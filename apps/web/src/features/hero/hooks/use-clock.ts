'use client';

import { useEffect, useState } from 'react';

/** The visitor's clock, updated every second. Null until the first tick, so the server render matches. */
export function useClock(): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);

  return now;
}
