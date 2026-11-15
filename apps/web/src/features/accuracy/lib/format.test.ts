import { describe, expect, it } from 'vitest';
import {
  barPercent,
  featureWords,
  fmtDiff,
  fmtElevation,
  fmtMae,
  fmtShare,
  fmtSmallDeg,
  fmtUtc,
} from './format';

describe('accuracy formatting', () => {
  it('formats elevations and small angles', () => {
    expect(fmtElevation(13.88)).toBe('13.88°');
    expect(fmtSmallDeg(0.0123)).toBe('0.0123°');
    expect(fmtSmallDeg(0.05)).toBe('0.05°');
    expect(fmtSmallDeg(0)).toBe('0.00°');
  });

  it('signs the difference from the journal', () => {
    expect(fmtDiff(13.88, 14.0)).toBe('−0.12°');
    expect(fmtDiff(16.49, 15.3)).toBe('+1.19°');
    expect(fmtDiff(10, 10)).toBe('0.00°');
    expect(fmtDiff(10, null)).toBe('No value');
  });

  it('formats errors and shares', () => {
    expect(fmtMae(0.0132)).toBe('0.013');
    expect(fmtShare(0.7067)).toBe('70.7 %');
    expect(fmtShare(0.99)).toBe('99.0 %');
  });

  it('sizes bars against the largest value', () => {
    expect(barPercent(0.0362, 0.0362)).toBe(100);
    expect(barPercent(0.0181, 0.0362)).toBeCloseTo(50);
    expect(barPercent(0.00001, 1)).toBe(2);
    expect(barPercent(0, 1)).toBe(0);
    expect(barPercent(1, 0)).toBe(0);
  });

  it('shows times in UTC', () => {
    expect(fmtUtc('1969-07-21T02:32:00Z')).toBe('1969-07-21 02:32 UTC');
    expect(fmtUtc('not a date')).toBe('not a date');
  });

  it('names model inputs in plain words', () => {
    expect(featureWords('any_part')).toBe('any part of the disc visible');
    expect(featureWords('new_input')).toBe('new input');
  });
});
