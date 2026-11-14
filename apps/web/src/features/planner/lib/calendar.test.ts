import { describe, expect, it } from 'vitest';
import {
  addLocalDays,
  bestWindows,
  calendarDays,
  dayJumpTime,
  HOUR,
  startOfLocalDay,
  toIntervals,
  windowJumpTime,
} from './calendar';

// A local midnight, so the tests hold in any time zone.
const day0 = new Date(2026, 10, 14, 0, 0, 0, 0).getTime();
const at = (day: number, hour: number) => addLocalDays(day0, day) + hour * HOUR;

describe('calendarDays', () => {
  it('makes one entry per local day', () => {
    const days = calendarDays(day0, [], 30);
    expect(days).toHaveLength(30);
    expect(days[0]!.start).toBe(day0);
    expect(days[1]!.start).toBe(addLocalDays(day0, 1));
    expect(days.every((d) => d.kind === 'bad' && d.firstGood === null)).toBe(
      true,
    );
  });

  it('adds up overlap hours and grades each day', () => {
    const windows = [
      { start: at(0, 2), end: at(0, 5) }, // 3 h on day 0
      { start: at(0, 20), end: at(2, 1) }, // 4 h on day 0, all of day 1, 1 h on day 2
    ];
    const [d0, d1, d2, d3] = calendarDays(day0, windows, 4);
    expect(d0!.hours).toBe(7);
    expect(d0!.kind).toBe('some');
    expect(d0!.firstGood).toEqual({ start: at(0, 2), end: at(0, 5) });
    expect(d1!.hours).toBe(24);
    expect(d1!.kind).toBe('good');
    expect(d2!.hours).toBe(1);
    expect(d2!.kind).toBe('some');
    expect(d3!.kind).toBe('bad');
  });

  it('counts 18 hours as a good day', () => {
    const [d] = calendarDays(day0, [{ start: at(0, 6), end: at(1, 0) }], 1);
    expect(d!.hours).toBe(18);
    expect(d!.kind).toBe('good');
  });
});

describe('dayJumpTime', () => {
  it('goes one hour into the first good stretch', () => {
    const [d] = calendarDays(day0, [{ start: at(0, 9), end: at(0, 15) }], 1);
    expect(dayJumpTime(d!)).toBe(at(0, 10));
  });

  it('stays inside a short stretch', () => {
    const [d] = calendarDays(day0, [{ start: at(0, 9), end: at(0, 10) }], 1);
    expect(dayJumpTime(d!)).toBe(at(0, 9.5));
  });

  it('goes to local noon on a day with no good time', () => {
    const [d] = calendarDays(day0, [], 1);
    expect(new Date(dayJumpTime(d!)).getHours()).toBe(12);
  });
});

describe('bestWindows', () => {
  const now = at(0, 10);
  const windows = [
    { start: at(0, 0), end: at(0, 8) }, // already over
    { start: at(0, 6), end: at(0, 14) }, // under way: counts 4 h from now
    { start: at(1, 0), end: at(1, 10) }, // 10 h
    { start: at(2, 0), end: at(2, 2) }, // 2 h
    { start: at(3, 0), end: at(4, 0) }, // 24 h
    { start: at(5, 0), end: at(5, 5) }, // 5 h
  ];

  it('keeps the four longest future windows in time order', () => {
    expect(bestWindows(windows, now)).toEqual([
      { start: now, end: at(0, 14) },
      { start: at(1, 0), end: at(1, 10) },
      { start: at(3, 0), end: at(4, 0) },
      { start: at(5, 0), end: at(5, 5) },
    ]);
  });

  it('is empty when nothing is left', () => {
    expect(bestWindows(windows, at(10, 0))).toEqual([]);
  });

  it('jumps an hour in, or to the middle of a short window', () => {
    expect(windowJumpTime({ start: at(1, 0), end: at(1, 10) })).toBe(at(1, 1));
    expect(windowJumpTime({ start: at(2, 0), end: at(2, 1) })).toBe(at(2, 0.5));
  });
});

describe('helpers', () => {
  it('parses API windows and drops empty ones', () => {
    expect(
      toIntervals([
        { start: '2026-11-14T00:00:00Z', end: '2026-11-14T03:00:00Z' },
        { start: '2026-11-15T00:00:00Z', end: '2026-11-15T00:00:00Z' },
      ]),
    ).toEqual([
      { start: Date.UTC(2026, 10, 14), end: Date.UTC(2026, 10, 14, 3) },
    ]);
  });

  it('finds local midnight', () => {
    expect(startOfLocalDay(at(3, 17.5))).toBe(addLocalDays(day0, 3));
  });
});
