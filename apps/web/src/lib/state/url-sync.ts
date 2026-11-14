'use client';

import { useEffect } from 'react';
import { DEFAULT_PLACE, type Place, useScenarioStore } from './scenario-store';

/** Reads ?site=, ?lat=&lon= and ?t= from a query string. Bad values fall back safely. */
export function parseScenarioQuery(search: string): {
  place: Place | null;
  timeMs: number | null;
} {
  const q = new URLSearchParams(search);
  let place: Place | null = null;
  const id = q.get('site');
  const lat = Number(q.get('lat'));
  const lon = Number(q.get('lon'));
  if (id && /^[a-z0-9-]{1,64}$/.test(id)) place = { kind: 'site', id };
  else if (
    q.has('lat') &&
    q.has('lon') &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Math.abs(lat) <= 90 &&
    lon >= -180 &&
    lon <= 360
  )
    place = { kind: 'point', lat, lon: lon > 180 ? lon - 360 : lon };
  const t = Date.parse(q.get('t') ?? '');
  return { place, timeMs: Number.isFinite(t) ? t : null };
}

export function scenarioQuery(place: Place, timeMs: number): string {
  const q = new URLSearchParams();
  if (place.kind === 'site') q.set('site', place.id);
  else {
    q.set('lat', place.lat.toFixed(4));
    q.set('lon', place.lon.toFixed(4));
  }
  q.set('t', new Date(timeMs).toISOString().slice(0, 16) + 'Z');
  return q.toString();
}

/** Keeps the planner's place and time in the address, so a link reproduces a result. */
export function useScenarioUrlSync(): void {
  useEffect(() => {
    const { place, timeMs } = parseScenarioQuery(window.location.search);
    const store = useScenarioStore.getState();
    if (place) store.setPlace(place);
    if (timeMs !== null) store.setTime(timeMs);
    let first = !place && timeMs === null;
    return useScenarioStore.subscribe((s) => {
      if (first && s.place === DEFAULT_PLACE) {
        first = false;
        return;
      }
      const url = `${window.location.pathname}?${scenarioQuery(s.place, s.timeMs)}${window.location.hash}`;
      window.history.replaceState(window.history.state, '', url);
    });
  }, []);
}
