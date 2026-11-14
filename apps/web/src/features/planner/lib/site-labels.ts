import { fmtCoord } from '@/lib/format/format';

/**
 * The places offered in Step 1, in this order, with the friendly names the
 * prototype used. Only ids that GET /sites returns are shown; the API's own
 * site name is the fallback label.
 */
export const PLANNER_SITES: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'shackleton-ridge', label: 'Shackleton rim ridge' },
  { id: 'malapert-massif', label: 'Malapert Massif' },
  { id: 'haworth', label: 'Haworth' },
  { id: 'mons-mouton', label: 'Mons Mouton' },
  { id: 'de-gerlache-rim-2', label: 'de Gerlache rim' },
  { id: 'south-pole-reference', label: 'South Pole' },
  { id: 'chandrayaan-3', label: 'Chandrayaan-3 (India)' },
  { id: 'apollo-11', label: 'Apollo 11' },
];

const FRIENDLY = new Map(PLANNER_SITES.map((s) => [s.id, s.label]));

export function chosenSpotLabel(lat: number, lon: number): string {
  return `Your chosen spot (${fmtCoord(lat, lon)})`;
}

/** The name shown for a place: friendly label, then the API name. */
export function siteLabel(id: string, apiName: string | undefined): string {
  return FRIENDLY.get(id) ?? apiName ?? id;
}
