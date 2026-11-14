import { api, unwrap } from './client';

/**
 * One-off sky lookup outside React (used by the 3D globe while aiming).
 * Points are rounded to 0.1 degree so nearby aims share one cached answer.
 */
const cache = new Map<string, ReturnType<typeof load>>();

function load(lat: number, lon: number, t: string) {
  return api
    .GET('/sky', { params: { query: { lat, lon, t } } })
    .then((r) => unwrap(r));
}

export function fetchSkyRounded(lat: number, lon: number, when: Date) {
  const rl = Math.round(lat * 10) / 10;
  const ro = Math.round(lon * 10) / 10;
  const t = new Date(
    Math.floor(when.getTime() / 600_000) * 600_000,
  ).toISOString();
  const key = `${rl},${ro},${t}`;
  let hit = cache.get(key);
  if (!hit) {
    if (cache.size > 2000) cache.clear();
    hit = load(rl, ro, t);
    hit.catch(() => cache.delete(key));
    cache.set(key, hit);
  }
  return hit;
}
