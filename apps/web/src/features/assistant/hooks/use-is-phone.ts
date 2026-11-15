'use client';

import { useSyncExternalStore } from 'react';

/** Below this width the panel fills the screen and traps focus. Matches the CSS module. */
const QUERY = '(max-width: 479.98px)';

function subscribe(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

export function isPhoneWidth(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(QUERY).matches;
}

export function useIsPhone(): boolean {
  return useSyncExternalStore(subscribe, isPhoneWidth, () => false);
}
