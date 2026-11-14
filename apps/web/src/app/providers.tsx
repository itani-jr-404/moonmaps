'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { SmoothScrollProvider } from '@/lib/motion/smooth-scroll';
import { useScenarioUrlSync } from '@/lib/state/url-sync';

function UrlSync() {
  useScenarioUrlSync();
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <SmoothScrollProvider>
        <UrlSync />
        {children}
      </SmoothScrollProvider>
    </QueryClientProvider>
  );
}
