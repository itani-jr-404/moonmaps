'use client';

import { create } from 'zustand';

type ToastState = {
  message: string;
  seq: number;
  show: (message: string) => void;
};

export const useToast = create<ToastState>((set, get) => ({
  message: '',
  seq: 0,
  show: (message) => {
    const seq = get().seq + 1;
    set({ message, seq });
    setTimeout(() => {
      if (get().seq === seq) set({ message: '' });
    }, 2600);
  },
}));

export function Toast() {
  const message = useToast((s) => s.message);
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed bottom-6 left-1/2 z-[900] -translate-x-1/2 rounded-full border border-line-2 bg-[#121d33] px-5 py-3 text-[13px] transition-[transform,opacity] duration-500 ${message ? 'translate-y-0 opacity-100' : 'translate-y-[200%] opacity-0'}`}
    >
      {message}
    </div>
  );
}
