import type { ReactNode } from 'react';

import { PageTransition } from '@/features/site-chrome/components/page-transition';

/** Next.js remounts a template on every navigation, which starts the page fade. */
export default function Template({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
