import { describe, expect, it } from 'vitest';
import type { ScenarioResult } from '@/lib/api/client';
import {
  dailyForecast,
  hoursText,
  outlookFrom,
  toWindows,
  upcomingWindows,
  windowAt,
} from './outlook';

const H = 3_600_000;
const T0 = Date.parse('2026-11-15T00:00:00Z');
const iso = (h: number) => new Date(T0 + h * H).toISOString();

function result(
  both: Array<[number, number]>,
  atStart: { sun: boolean; earth: boolean },
): ScenarioResult {
  return {
    start: iso(0),
    end: iso(240),
    step_minutes: 60,
    at_start: {
      sun_visible: atStart.sun,
      earth_visible: atStart.earth,
      sun_clearance: 0,
      earth_clearance: 0,
    },
    windows: {
      sun: [],
      earth: [],
      both: both.map(([a, b]) => ({ start: iso(a), end: iso(b) })),
    },
  } as unknown as ScenarioResult;
}

describe('windows', () => {
  it('measures durations and flags windows that reach the end of the range', () => {
    const w = toWindows(
      [
        { start: iso(10), end: iso(20) },
        { start: iso(0), end: iso(5) },
        { start: iso(230), end: iso(240) },
      ],
      T0 + 240 * H,
      H,
    );
    expect(w.map((x) => x.durationMs / H)).toEqual([5, 10, 10]);
    expect(w.map((x) => x.openEnded)).toEqual([false, false, true]);
    expect(windowAt(w, T0 + 12 * H)?.startMs).toBe(T0 + 10 * H);
    expect(windowAt(w, T0 + 7 * H)).toBeNull();
    expect(upcomingWindows(w, T0 + 1 * H, 1)[0]?.startMs).toBe(T0 + 10 * H);
  });

  it('says how long a good site stays good and lists the next windows', () => {
    const o = outlookFrom(
      result(
        [
          [0, 6],
          [30, 40],
          [50, 52],
          [80, 90],
          [100, 101],
        ],
        { sun: true, earth: true },
      ),
    );
    expect(o.goodNow).toBe(true);
    expect(o.current?.durationMs).toBe(6 * H);
    expect(o.upcoming.map((w) => (w.startMs - T0) / H)).toEqual([30, 50, 80]);
    expect(o.next?.durationMs).toBe(10 * H);
  });

  it('says when a site that is not good now is next good', () => {
    const o = outlookFrom(result([[12, 20]], { sun: true, earth: false }));
    expect(o.goodNow).toBe(false);
    expect(o.current).toBeNull();
    expect(o.next?.startMs).toBe(T0 + 12 * H);
    expect(o.next?.durationMs).toBe(8 * H);
  });

  it('has no next window when none comes in the range', () => {
    const o = outlookFrom(result([], { sun: false, earth: false }));
    expect(o.next).toBeNull();
    expect(o.upcoming).toEqual([]);
  });
});

describe('dailyForecast', () => {
  it('adds up hours per UTC day, counting each sample as one step', () => {
    // 30-minute samples from 12:00 on day one to 23:30 on day two.
    const t: string[] = [];
    const sun: boolean[] = [];
    const earth: boolean[] = [];
    for (let i = 0; i < 72; i++) {
      t.push(new Date(T0 + 12 * H + i * 30 * 60_000).toISOString());
      sun.push(i % 2 === 0);
      earth.push(i < 24);
    }
    const days = dailyForecast(
      { t, sun_visible: sun, earth_visible: earth },
      30,
      14,
    );
    expect(days).toHaveLength(2);
    expect(days[0]).toMatchObject({
      dayMs: T0,
      coveredHours: 12,
      sunHours: 6,
      earthHours: 12,
      bothHours: 6,
    });
    expect(days[1]).toMatchObject({
      dayMs: T0 + 24 * H,
      coveredHours: 24,
      sunHours: 12,
      earthHours: 0,
      bothHours: 0,
    });
  });

  it('stops after the requested number of days and handles an empty series', () => {
    const t = Array.from({ length: 24 * 5 }, (_, i) => iso(i));
    const yes = t.map(() => true);
    expect(
      dailyForecast({ t, sun_visible: yes, earth_visible: yes }, 60, 3),
    ).toHaveLength(3);
    expect(
      dailyForecast({ t: [], sun_visible: [], earth_visible: [] }, 60, 3),
    ).toEqual([]);
  });

  it('prints hours with at most one decimal', () => {
    expect(hoursText(12)).toBe('12 h');
    expect(hoursText(6.5)).toBe('6.5 h');
    expect(hoursText(0.04)).toBe('0 h');
  });
});
