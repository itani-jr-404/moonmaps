'use client';

import { useEffect, useState } from 'react';

import { useSky } from '@/lib/api/hooks';

/** A point next to the lunar south pole; the API answers for this exact place. */
const SOUTH_POLE = { lat: -89.9, lon: 0 } as const;
const MINUTE = 60_000;

function minuteIso(ms: number): string {
  return new Date(Math.floor(ms / MINUTE) * MINUTE).toISOString();
}

/**
 * The Sun and the Earth seen from the south pole right now, asked again every
 * minute. The time is rounded to the minute so the request is cached.
 */
export function useSouthPoleSky() {
  const [timeIso, setTimeIso] = useState(() => minuteIso(Date.now()));

  useEffect(() => {
    const id = window.setInterval(
      () => setTimeIso(minuteIso(Date.now())),
      MINUTE,
    );
    return () => window.clearInterval(id);
  }, []);

  return useSky(SOUTH_POLE, timeIso);
}
