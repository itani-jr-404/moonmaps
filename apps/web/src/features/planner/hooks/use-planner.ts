'use client';

import { useEffect, useMemo, useState } from 'react';

import { useAnalyze } from '@/lib/api/hooks';
import type { Scenario, ScenarioResult } from '@/lib/api/client';
import { siteRef, useScenarioStore } from '@/lib/state/scenario-store';
import {
  addLocalDays,
  bestWindows,
  calendarDays,
  DAY,
  startOfLocalDay,
  toIntervals,
  type CalendarDay,
  type Interval,
} from '../lib/calendar';
import { chosenSpotLabel, siteLabel } from '../lib/site-labels';

const MINUTE = 60_000;
/** The verdict scenario looks 35 days ahead so "until" times exist for a month-long day or night. */
const VERDICT_SPAN = 35 * DAY;
const CALENDAR_DAYS = 30;
const STEP_MINUTES = 30;

const iso = (t: number) => new Date(t).toISOString();

/** The current time, refreshed every minute, so "today" rolls over at local midnight. */
function useMinuteClock(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), MINUTE);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export interface PlannerVerdict {
  /** The moment the answer is for (ms). */
  t: number;
  where: string;
  sun: boolean;
  earth: boolean;
  good: boolean;
  nextSunset: number | null;
  nextSunrise: number | null;
  nextEarthset: number | null;
  nextEarthrise: number | null;
}

const parseOrNull = (s: string | null) => (s === null ? null : Date.parse(s));

function toVerdict(r: ScenarioResult): PlannerVerdict {
  const sun = r.at_start.sun_visible;
  const earth = r.at_start.earth_visible;
  return {
    t: Date.parse(r.start),
    where:
      r.site.kind === 'custom'
        ? chosenSpotLabel(r.site.lat, r.site.lon)
        : siteLabel(r.site.id, r.site.name),
    sun,
    earth,
    good: sun && earth,
    nextSunset: parseOrNull(r.metrics.next_sunset),
    nextSunrise: parseOrNull(r.metrics.next_sunrise),
    nextEarthset: parseOrNull(r.metrics.next_earthset),
    nextEarthrise: parseOrNull(r.metrics.next_earthrise),
  };
}

/**
 * The planner's data: one /analyze call with two scenarios. A) the verdict at
 * the chosen moment, B) the 30 days from local midnight today for the
 * calendar and the best windows. All visibility comes from the API.
 */
export function usePlanner() {
  const place = useScenarioStore((s) => s.place);
  const timeMs = useScenarioStore((s) => s.timeMs);
  const now = useMinuteClock();
  const day0 = startOfLocalDay(now);
  const t = Math.round(timeMs / MINUTE) * MINUTE;

  const scenarios = useMemo<Scenario[]>(() => {
    const site = siteRef(place);
    return [
      {
        site,
        start: iso(t),
        end: iso(t + VERDICT_SPAN),
        step_minutes: STEP_MINUTES,
        include_series: false,
      },
      {
        site,
        start: iso(day0),
        end: iso(addLocalDays(day0, CALENDAR_DAYS)),
        step_minutes: STEP_MINUTES,
        include_series: false,
      },
    ];
  }, [place, t, day0]);

  const query = useAnalyze(scenarios);
  const verdictResult = query.data?.[0];
  const calendarResult = query.data?.[1];

  const verdict = useMemo(
    () => (verdictResult ? toVerdict(verdictResult) : null),
    [verdictResult],
  );

  const both = useMemo<Interval[] | null>(
    () => (calendarResult ? toIntervals(calendarResult.windows.both) : null),
    [calendarResult],
  );

  const days = useMemo<CalendarDay[] | null>(
    () =>
      both && calendarResult
        ? calendarDays(
            startOfLocalDay(Date.parse(calendarResult.start)),
            both,
            CALENDAR_DAYS,
          )
        : null,
    [both, calendarResult],
  );

  const best = useMemo(
    () => (both ? bestWindows(both, now) : null),
    [both, now],
  );

  return {
    timeMs: t,
    verdict,
    days,
    best,
    isPending: query.isPending,
    /** A newer answer is on its way; the one shown is the previous one. */
    isUpdating: query.isFetching && query.data !== undefined,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}
