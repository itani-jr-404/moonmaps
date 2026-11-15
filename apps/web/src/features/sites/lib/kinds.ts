import type { Site } from '@/lib/api/client';

/** Plain names for the API's site kinds, in the order the sites page lists them. */
export const KIND_ORDER: ReadonlyArray<{ kind: Site['kind']; label: string }> =
  [
    { kind: 'artemis-candidate', label: 'Artemis candidate sites' },
    { kind: 'clps', label: 'Commercial landers' },
    { kind: 'international', label: 'Landers from other countries' },
    { kind: 'apollo', label: 'Apollo landings' },
    { kind: 'reference', label: 'Reference points' },
    { kind: 'custom', label: 'Your spots' },
  ];

const SINGULAR: Record<Site['kind'], string> = {
  'artemis-candidate': 'Artemis candidate site',
  clps: 'Commercial lander',
  international: 'Lander from another country',
  apollo: 'Apollo landing',
  reference: 'Reference point',
  custom: 'A spot you chose',
};

export function kindLabel(kind: Site['kind']): string {
  return SINGULAR[kind];
}

/** Sites grouped by kind, in KIND_ORDER, leaving out empty groups. */
export function groupByKind(
  sites: readonly Site[],
): Array<{ kind: Site['kind']; label: string; sites: Site[] }> {
  return KIND_ORDER.map(({ kind, label }) => ({
    kind,
    label,
    sites: sites.filter((s) => s.kind === kind),
  })).filter((g) => g.sites.length > 0);
}

/** True for a latitude and longitude the API accepts. */
export function isValidPoint(lat: number, lon: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    lon >= -180 &&
    lon <= 360
  );
}
