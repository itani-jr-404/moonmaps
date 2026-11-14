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
