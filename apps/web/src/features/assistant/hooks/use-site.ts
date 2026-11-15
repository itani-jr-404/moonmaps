'use client';

import { useSites } from '@/lib/api/hooks';
import type { Site } from '@/lib/api/client';

/** A curated site from GET /sites, or null while loading, on error, or for an unknown id. */
export function useSite(id: string | null | undefined): Site | null {
  const sites = useSites();
  if (!id) return null;
  return sites.data?.find((s) => s.id === id) ?? null;
}
