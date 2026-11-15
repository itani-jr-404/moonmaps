import { api, unwrap, type SkyResponse } from '@/lib/api/client';

import type { HorizonProfile } from './skyline';

/*
 * API calls for the landed view. Every Sun and Earth position and every
 * yes/no shown on the surface comes from these answers.
 */

const DAY = 86_400_000;
/** How far ahead "Skip to sunrise" looks: a little over one lunar day. */
const SUNRISE_SEARCH_DAYS = 35;

/** The sky over one point at one exact moment (no rounding: the HUD shows this time). */
export async function fetchSkyAt(
  lat: number,
  lon: number,
  timeMs: number,
): Promise<SkyResponse> {
  return unwrap(
    await api.GET('/sky', {
      params: { query: { lat, lon, t: new Date(timeMs).toISOString() } },
    }),
  );
}

/** How long a span is asked for when only the horizon is needed. */
const HORIZON_SPAN_MS = 3_600_000;

/**
 * The terrain horizon at a point from NASA LOLA grids, as the API computes it
 * (the `horizon` of POST /analyze). The landed view draws it as the far hills.
 */
export async function fetchHorizon(
  lat: number,
  lon: number,
): Promise<HorizonProfile> {
  const start = Date.now();
  const { results } = unwrap(
    await api.POST('/analyze', {
      body: {
        scenarios: [
          {
            site: { lat, lon },
            start: new Date(start).toISOString(),
            end: new Date(start + HORIZON_SPAN_MS).toISOString(),
            step_minutes: 60,
            include_series: false,
          },
        ],
      },
    }),
  );
  const result = results[0];
  if (!result) throw new Error('The API returned no result.');
  return {
    elevationDeg: result.horizon.elevation_deg,
    azStepDeg: result.horizon.az_step_deg,
  };
}

export interface NextSunrise {
  /** When the Sun next clears the terrain horizon, or null if not within the search. */
  sunriseMs: number | null;
  /** Whether the Sun is already visible at the start time. */
  sunVisibleAtStart: boolean;
}

/** Asks the API when the Sun next rises over the real horizon at this point. */
export async function fetchNextSunrise(
  lat: number,
  lon: number,
  startMs: number,
): Promise<NextSunrise> {
  const { results } = unwrap(
    await api.POST('/analyze', {
      body: {
        scenarios: [
          {
            site: { lat, lon },
            start: new Date(startMs).toISOString(),
            end: new Date(startMs + SUNRISE_SEARCH_DAYS * DAY).toISOString(),
            step_minutes: 30,
            include_series: false,
          },
        ],
      },
    }),
  );
  const result = results[0];
  if (!result) throw new Error('The API returned no result.');
  const rise = result.metrics.next_sunrise;
  return {
    sunriseMs: rise ? Date.parse(rise) : null,
    sunVisibleAtStart: result.at_start.sun_visible,
  };
}
