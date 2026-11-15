import type { Site } from '@/lib/api/client';
import { D2R, latLonToVector } from '@/scene/units';

/*
 * Words for the landing verdict. The yes/no inputs always come from the API's
 * `visible` flags; this file only turns them into sentences.
 */

/** A spot is a good landing site when the Sun and the Earth are both visible (ADR-005). */
export function isGood(sun: boolean, earth: boolean): boolean {
  return sun && earth;
}

export function verdictText(good: boolean): string {
  return good ? 'Good landing site' : 'Bad landing site';
}

export function whyText(sun: boolean, earth: boolean): string {
  if (sun && earth) {
    return 'Why good: the Sun is above the horizon, so solar panels make power, and Earth is above the horizon, so the lander can radio home directly.';
  }
  if (!sun && !earth) {
    return 'Why bad: the Sun is below the horizon (no solar power) and Earth is hidden (no direct radio contact).';
  }
  if (!sun) {
    return 'Why bad: Earth is in view, but the Sun is below the horizon or blocked by hills, so there is no solar power.';
  }
  return 'Why bad: there is sunlight, but Earth is below the horizon, so the lander cannot radio home without a relay satellite.';
}

/** "Spot 85.3°S, 30.2°E", for a point that is not a curated site. */
export function spotLabel(lat: number, lon: number): string {
  return `Spot ${Math.abs(lat).toFixed(1)}°${lat < 0 ? 'S' : 'N'}, ${Math.abs(lon).toFixed(1)}°${lon < 0 ? 'W' : 'E'}`;
}

/**
 * A point closer than this to a curated site is labelled "near <site>" (the prototype's value).
 * The point keeps its own coordinates; only a click on the pin picks the site (pick.ts).
 */
export const NEAR_SITE_DEG = 2.2;

/** The curated site nearest to a point, if one lies within NEAR_SITE_DEG of arc. */
export function nearestSite(
  sites: readonly Site[],
  lat: number,
  lon: number,
): Site | null {
  const p = latLonToVector(lat, lon);
  let best: Site | null = null;
  let bestDeg = NEAR_SITE_DEG;
  for (const s of sites) {
    const d = Math.acos(Math.min(1, p.dot(latLonToVector(s.lat, s.lon)))) / D2R;
    if (d < bestDeg) {
      bestDeg = d;
      best = s;
    }
  }
  return best;
}
