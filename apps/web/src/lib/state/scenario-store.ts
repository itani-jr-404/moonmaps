'use client';

import { create } from 'zustand';

/** A place is a curated site id or a point chosen on the globe. */
export type Place =
  { kind: 'site'; id: string } | { kind: 'point'; lat: number; lon: number };

export const DEFAULT_PLACE: Place = { kind: 'site', id: 'shackleton-ridge' };
const MINUTE = 60_000;

type ScenarioState = {
  place: Place;
  /** The moment the planner asks about, in milliseconds since 1970 (UTC). */
  timeMs: number;
  setPlace: (place: Place) => void;
  setTime: (timeMs: number) => void;
};

export const useScenarioStore = create<ScenarioState>((set) => ({
  place: DEFAULT_PLACE,
  timeMs: Math.floor(Date.now() / MINUTE) * MINUTE,
  setPlace: (place) => set({ place }),
  setTime: (timeMs) => set({ timeMs: Math.round(timeMs / MINUTE) * MINUTE }),
}));

export function placeKey(place: Place): string {
  return place.kind === 'site'
    ? place.id
    : `${place.lat.toFixed(4)},${place.lon.toFixed(4)}`;
}

/** The API's site reference for a place. */
export function siteRef(place: Place) {
  return place.kind === 'site'
    ? { id: place.id }
    : { lat: place.lat, lon: place.lon };
}
