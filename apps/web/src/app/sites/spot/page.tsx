import type { Metadata } from 'next';

import { SiteDetail } from '@/features/sites/components/site-detail';

export const metadata: Metadata = { title: 'Your spot' };

/** The site page for any point on the Moon: /sites/spot?lat=..&lon=.. */
export default async function SpotPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = await searchParams;
  const num = (v: string | string[] | undefined) =>
    typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
  return <SiteDetail lat={num(q.lat)} lon={num(q.lon)} />;
}
