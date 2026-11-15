import { describe, expect, it } from 'vitest';
import { compassWord, fmtCoord, fmtDeg, plainDuration } from './format';

const H = 3_600_000;

describe('format', () => {
  it('says durations in plain words', () => {
    expect(plainDuration(null)).toBe('more than a month');
    expect(plainDuration(0.6 * H)).toBe('about an hour');
    expect(plainDuration(5 * H)).toBe('5 hours');
    expect(plainDuration(24 * H)).toBe('1 day');
    expect(plainDuration((11 * 24 + 17) * H)).toBe('11 days 17 hours');
  });

  it('formats coordinates with hemispheres', () => {
    expect(fmtCoord(-89.45, -137.3, 2)).toBe('89.45°S  137.30°W');
  });

  it('formats signed angles and compass words', () => {
    expect(fmtDeg(1.5)).toBe('+1.50°');
    expect(fmtDeg(-0.25, 1)).toBe('−0.3°');
    expect(compassWord(359)).toBe('north');
    expect(compassWord(-90)).toBe('west');
  });
});

describe('site page formats', () => {
  it('formats days, dates, distances and percentages', async () => {
    const { fmtUtcDay, fmtDate, fmtKm, fmtPercent } = await import('./format');
    expect(fmtUtcDay(Date.parse('2026-11-15T23:30:00Z'))).toBe('Sun 15 Nov');
    expect(fmtDate(Date.parse('1969-07-20T20:17:40Z'))).toBe('20 July 1969');
    expect(fmtKm(384399.6)).toBe('384,400 km');
    expect(fmtPercent(0.416)).toBe('42%');
  });

  it('formats UTC times and trip lengths', async () => {
    const { fmtUtc, fmtTravelDays } = await import('./format');
    expect(fmtUtc(Date.parse('2026-12-01T12:00:00Z'))).toBe(
      'Tue, 1 Dec 2026, 12:00 UTC',
    );
    expect(fmtTravelDays(102.76)).toBe('4.3 days');
    expect(fmtTravelDays(3231.63)).toBe('134.7 days');
  });
});
