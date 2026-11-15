import type { Metadata } from 'next';

import { SitesIndex } from '@/features/sites/components/sites-index';

export const metadata: Metadata = { title: 'Sites' };

export default function SitesPage() {
  return <SitesIndex />;
}
