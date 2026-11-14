'use client';

import { create } from 'zustand';

/** Set once the opening intro has finished, so the nav and scroll reveals can start. */
export const useIntroStore = create<{ done: boolean; finish: () => void }>(
  (set) => ({
    done: false,
    finish: () => set({ done: true }),
  }),
);
