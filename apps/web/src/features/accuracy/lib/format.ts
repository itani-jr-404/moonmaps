/** Formatting for the accuracy page. Every value comes from GET /accuracy; nothing is computed here but display. */

/** The repository's validation report (docs/VALIDATION.md) on GitHub. */
export const VALIDATION_URL =
  'https://github.com/itani-jr-404/moonmaps/blob/main/docs/VALIDATION.md';

/** "13.88°". */
export function fmtElevation(deg: number): string {
  return `${deg.toFixed(2)}°`;
}

/** "0.0123°": small angles keep up to four decimals, without trailing zeros past two. */
export function fmtSmallDeg(deg: number): string {
  const s = deg.toFixed(4).replace(/(\.\d\d\d??)0+$/, '$1');
  return `${s}°`;
}

/** Our value minus the journal's, signed: "−0.12°", "+1.19°", "0.00°"; "No value" when the journal has none. */
export function fmtDiff(ours: number, journal: number | null): string {
  if (journal === null) return 'No value';
  const d = Math.round((ours - journal) * 100) / 100;
  if (d === 0) return '0.00°';
  return `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(2)}°`;
}

/** "0.013": a mean absolute error, as a share of time (0 to 1). */
export function fmtMae(mae: number): string {
  return mae.toFixed(3);
}

/** "99.0 %": a share from 0 to 1. */
export function fmtShare(fraction: number): string {
  return `${(fraction * 100).toFixed(1)} %`;
}

/** Width of a bar in percent of the largest value, at least 2 % so a tiny bar stays visible. */
export function barPercent(value: number, max: number): number {
  if (!(max > 0) || !(value > 0)) return 0;
  return Math.max(2, Math.min(100, (value / max) * 100));
}

/** "1969-07-21 02:32 UTC". */
export function fmtUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const s = d.toISOString();
  return `${s.slice(0, 10)} ${s.slice(11, 16)} UTC`;
}

/** "Sun" or "Earth". */
export function bodyName(body: 'sun' | 'earth'): string {
  return body === 'sun' ? 'Sun' : 'Earth';
}

/** Model inputs in plain words, for the ids the API uses; unknown ids are shown as they are. */
const FEATURE_WORDS: Record<string, string> = {
  centre: 'centre of the disc visible',
  any_part: 'any part of the disc visible',
  abs_lat_deg: 'distance from the equator',
  centre_x_abs_lat_deg: 'centre visible × distance from the equator',
};

export function featureWords(id: string): string {
  return FEATURE_WORDS[id] ?? id.replace(/_/g, ' ');
}
