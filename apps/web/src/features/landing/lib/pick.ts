import type { Site } from '@/lib/api/client';
import type { Place } from '@/lib/state/scenario-store';
import { D2R, latLonToVector } from '@/scene/units';

import { nearestSite, spotLabel } from './verdict';

/*
 * Which point a pointer on the globe means. The aim card, the landing, the
 * chat context and every API call use the same point, so they can never
 * disagree about where the visitor is.
 *
 * A curated site is used only when the pointer is on its pin. Anywhere else
 * the point keeps its own coordinates; a site within NEAR_SITE_DEG is only
 * named as "near <site>". (Earlier, every point within 2.2 degrees, about
 * 67 km, was replaced by the site, so a spot near the pole was treated as
 * the pole site.)
 */

/**
 * A pointer this close to a site picks it, degrees of arc: the pin's radius
 * on the globe (0.011 Moon radii, about 0.63 degrees; globe-scene.ts) plus a
 * small margin for the pointer.
 */
export const PIN_PICK_DEG = 0.8;

/**
 * Digits kept for a point that is not a site. 0.1 degree is the rounding the
 * aim card's answers use (ADR-011, src/lib/api/fetch-sky.ts); at the orbit
 * view one screen pixel already covers about 0.2 degree, so this is the
 * finest point the pointer can choose. The landing uses the same point, so
 * the card and the landed panel describe one place.
 */
const POINT_DIGITS = 1;

export interface PickedPoint {
  lat: number;
  lon: number;
  /** The curated site, only when its pin was picked. */
  siteId: string | null;
  /** The site name, or "Spot 85.3°S, 30.2°E". */
  label: string;
  /** The closest curated site within NEAR_SITE_DEG, when no site was picked. */
  near: string | null;
}

const round = (v: number, digits: number) => {
  const k = 10 ** digits;
  return Math.round(v * k) / k;
};

function arcDeg(aLat: number, aLon: number, bLat: number, bLon: number) {
  const dot = latLonToVector(aLat, aLon).dot(latLonToVector(bLat, bLon));
  return Math.acos(Math.min(1, Math.max(-1, dot))) / D2R;
}

/** The point under the pointer: a site only when its pin is picked, otherwise the point itself. */
export function pickPoint(
  sites: readonly Site[],
  lat: number,
  lon: number,
): PickedPoint {
  let pinned: Site | null = null;
  let best = PIN_PICK_DEG;
  for (const s of sites) {
    const d = arcDeg(lat, lon, s.lat, s.lon);
    if (d < best) {
      best = d;
      pinned = s;
    }
  }
  if (pinned) {
    return {
      lat: pinned.lat,
      lon: pinned.lon,
      siteId: pinned.id,
      label: pinned.name,
      near: null,
    };
  }
  const pLat = round(lat, POINT_DIGITS);
  // -180 and 180 are the same meridian; the API takes -180 to 180.
  const pLon =
    round(lon, POINT_DIGITS) === 180 ? -180 : round(lon, POINT_DIGITS);
  return {
    lat: pLat,
    lon: pLon,
    siteId: null,
    label: spotLabel(pLat, pLon),
    near: nearestSite(sites, pLat, pLon)?.name ?? null,
  };
}

/** The planner and chat place for a picked point. */
export function placeOf(p: {
  siteId: string | null;
  lat: number;
  lon: number;
}): Place {
  return p.siteId
    ? { kind: 'site', id: p.siteId }
    : { kind: 'point', lat: p.lat, lon: p.lon };
}
