/*
 * Pure helpers for the planner's 30-day calendar and "best times" list.
 * They only rearrange the time windows the API returned (`windows.both`);
 * they never decide whether the Sun or the Earth is visible.
 */

export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

/** Hours of good time in a day for it to count as a "Good day" (the prototype's threshold). */
export const GOOD_DAY_HOURS = 18;

/** A time window in milliseconds since 1970, start inclusive, end exclusive. */
export interface Interval {
  start: number;
  end: number;
}

/** API windows (ISO strings) to millisecond intervals. */
export function toIntervals(
  windows: ReadonlyArray<{ start: string; end: string }>,
): Interval[] {
  return windows
    .map((w) => ({ start: Date.parse(w.start), end: Date.parse(w.end) }))
    .filter(
      (w) =>
        Number.isFinite(w.start) && Number.isFinite(w.end) && w.end > w.start,
    );
}

/** Midnight at the start of the visitor's local day containing `t`. */
export function startOfLocalDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Local midnight `days` calendar days after `dayStart` (safe across daylight-saving changes). */
export function addLocalDays(dayStart: number, days: number): number {
  const d = new Date(dayStart);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

export type DayKind = 'good' | 'some' | 'bad';

export interface CalendarDay {
  /** Local midnight. */
  start: number;
  /** Next local midnight. */
  end: number;
  /** Hours of the day inside a good window. */
  hours: number;
  kind: DayKind;
  /** The first good stretch inside this day, or null when there is none. */
  firstGood: Interval | null;
}

/** One entry per local day from `day0`, with how many hours overlap the good windows. */
export function calendarDays(
  day0: number,
  windows: readonly Interval[],
  count = 30,
): CalendarDay[] {
  const sorted = [...windows].sort((a, b) => a.start - b.start);
  const days: CalendarDay[] = [];
  for (let i = 0; i < count; i++) {
    const start = addLocalDays(day0, i);
    const end = addLocalDays(day0, i + 1);
    let ms = 0;
    let firstGood: Interval | null = null;
    for (const w of sorted) {
      const a = Math.max(start, w.start);
      const b = Math.min(end, w.end);
      if (b <= a) continue;
      ms += b - a;
      firstGood ??= { start: a, end: b };
    }
    const hours = ms / HOUR;
    const kind: DayKind =
      hours >= GOOD_DAY_HOURS ? 'good' : hours > 0 ? 'some' : 'bad';
    days.push({ start, end, hours, kind, firstGood });
  }
  return days;
}

/**
 * The moment a click on a calendar day jumps to: one hour into the day's
 * first good stretch (the prototype's choice), kept inside that stretch when
 * it is shorter than two hours; local noon when the day has no good time.
 */
export function dayJumpTime(day: CalendarDay): number {
  if (day.firstGood) {
    const { start, end } = day.firstGood;
    return start + Math.min(HOUR, (end - start) / 2);
  }
  const d = new Date(day.start);
  d.setHours(12, 0, 0, 0);
  return d.getTime();
}

/**
 * The longest good windows still to come, at most `count`, listed in time
 * order. A window already under way counts from `now`, as in the prototype.
 */
export function bestWindows(
  windows: readonly Interval[],
  now: number,
  count = 4,
): Interval[] {
  return windows
    .filter((w) => w.end > now)
    .map((w) => ({ start: Math.max(w.start, now), end: w.end }))
    .sort((a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start)
    .slice(0, count)
    .sort((a, b) => a.start - b.start);
}

/** Where a click on a best window jumps to: an hour in, or the middle of a short window. */
export function windowJumpTime(w: Interval): number {
  return w.start + Math.min(HOUR, (w.end - w.start) / 2);
}
