import type { Metadata } from 'next';

import { SiteDetail } from '@/features/sites/components/site-detail';

export const metadata: Metadata = { title: 'Site' };

export default async function SitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SiteDetail siteId={decodeURIComponent(id)} />;
}
