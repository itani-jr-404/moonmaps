'use client';

import { useSyncExternalStore } from 'react';

const MINUTE = 60_000;

function subscribe(cb: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  const schedule = () => {
    // Fires just after the next whole minute.
    timer = setTimeout(
      () => {
        cb();
        schedule();
      },
      MINUTE - (Date.now() % MINUTE) + 50,
    );
  };
  schedule();
  return () => clearTimeout(timer);
}

const snapshot = () => Math.floor(Date.now() / MINUTE) * MINUTE;

/** The current minute (ms since 1970), updating each minute. 0 while rendering on the server. */
export function useUtcMinute(): number {
  return useSyncExternalStore(subscribe, snapshot, () => 0);
}
