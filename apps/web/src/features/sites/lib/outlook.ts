import type { ScenarioResult } from '@/lib/api/client';

/*
 * Pure helpers that read one POST /analyze result for the site page. They only
 * pick, count and sort what the API returned: the windows, the series flags and
 * the metrics. Nothing here decides whether the Sun or the Earth is visible.
 */

const HOUR = 3_600_000;
const DAY = 86_400_000;

export interface TimeWindow {
  startMs: number;
  endMs: number;
  /** End minus start, in milliseconds. */
  durationMs: number;
  /** True when the window reaches the end of the analysed range, so it may last longer. */
  openEnded: boolean;
}

/** Turns the API's ISO windows into numbers, sorted by start. */
export function toWindows(
  windows: ReadonlyArray<{ start: string; end: string }>,
  rangeEndMs: number,
  stepMs: number,
): TimeWindow[] {
  return windows
    .map((w) => {
      const startMs = Date.parse(w.start);
      const endMs = Date.parse(w.end);
      return {
        startMs,
        endMs,
        durationMs: Math.max(0, endMs - startMs),
        openEnded: endMs >= rangeEndMs - stepMs,
      };
    })
    .filter((w) => Number.isFinite(w.startMs) && Number.isFinite(w.endMs))
    .sort((a, b) => a.startMs - b.startMs);
}

/** The window that contains this moment, or null. */
export function windowAt(
  windows: readonly TimeWindow[],
  nowMs: number,
): TimeWindow | null {
  return windows.find((w) => w.startMs <= nowMs && nowMs < w.endMs) ?? null;
}

/** The next windows that start after this moment, at most `count`. */
export function upcomingWindows(
  windows: readonly TimeWindow[],
  nowMs: number,
  count: number,
): TimeWindow[] {
  return windows.filter((w) => w.startMs > nowMs).slice(0, count);
}

export interface Outlook {
  /** Both bodies visible at the start of the range, from the API's at_start flags. */
  goodNow: boolean;
  /** The current window with both in view, when good now. */
  current: TimeWindow | null;
  /** The next window with both in view that starts later. */
  next: TimeWindow | null;
  /** Up to three windows with both in view after the current one. */
  upcoming: TimeWindow[];
}

/** What the site page says about "good now, and for how long" from one analyze result. */
export function outlookFrom(result: ScenarioResult, count = 3): Outlook {
  const startMs = Date.parse(result.start);
  const endMs = Date.parse(result.end);
  const stepMs = result.step_minutes * 60_000;
  const both = toWindows(result.windows.both, endMs, stepMs);
  const goodNow = result.at_start.sun_visible && result.at_start.earth_visible;
  const current = goodNow ? (windowAt(both, startMs) ?? both[0] ?? null) : null;
  const after = current ? current.endMs : startMs;
  const upcoming = upcomingWindows(
    both.filter((w) => w !== current),
    after - 1,
    count,
  );
  return { goodNow, current, next: upcoming[0] ?? null, upcoming };
}

export interface ForecastDay {
  /** Midnight UTC that starts the day. */
  dayMs: number;
  /** Hours of this day that the analysis covers (less than 24 on the first and last day). */
  coveredHours: number;
  sunHours: number;
  earthHours: number;
  bothHours: number;
}

/**
 * Splits the series into UTC days and adds up, for each day, the hours with the
 * Sun visible, the Earth visible and both. Each sample stands for one step.
 */
export function dailyForecast(
  series: {
    t: readonly string[];
    sun_visible: readonly boolean[];
    earth_visible: readonly boolean[];
  },
  stepMinutes: number,
  days: number,
): ForecastDay[] {
  const stepHours = stepMinutes / 60;
  const out: ForecastDay[] = [];
  const first = Date.parse(series.t[0] ?? '');
  if (!Number.isFinite(first)) return out;
  const firstDay = Math.floor(first / DAY) * DAY;
  for (let i = 0; i < series.t.length; i++) {
    const ms = Date.parse(series.t[i]!);
    const index = Math.floor((ms - firstDay) / DAY);
    if (index < 0 || index >= days) continue;
    while (out.length <= index) {
      out.push({
        dayMs: firstDay + out.length * DAY,
        coveredHours: 0,
        sunHours: 0,
        earthHours: 0,
        bothHours: 0,
      });
    }
    const day = out[index]!;
    const sun = series.sun_visible[i] === true;
    const earth = series.earth_visible[i] === true;
    day.coveredHours += stepHours;
    if (sun) day.sunHours += stepHours;
    if (earth) day.earthHours += stepHours;
    if (sun && earth) day.bothHours += stepHours;
  }
  return out;
}

/** Hours rounded to one decimal, for the forecast cards. */
export function hoursText(hours: number): string {
  const r = Math.round(hours * 10) / 10;
  return `${Number.isInteger(r) ? r.toFixed(0) : r.toFixed(1)} h`;
}

/** Hours as milliseconds, for plainDuration. */
export function hoursToMs(hours: number): number {
  return hours * HOUR;
}
