import { describe, expect, it } from 'vitest';

import type { Site } from '@/lib/api/client';

import {
  isGood,
  nearestSite,
  spotLabel,
  verdictText,
  whyText,
} from './verdict';

const site = (id: string, lat: number, lon: number): Site => ({
  id,
  name: id,
  lat,
  lon,
  kind: 'reference',
  description: '',
});

describe('verdict words', () => {
  it('is good only when both the Sun and the Earth are visible', () => {
    expect(isGood(true, true)).toBe(true);
    expect(isGood(true, false)).toBe(false);
    expect(isGood(false, true)).toBe(false);
    expect(verdictText(true)).toBe('Good landing site');
    expect(verdictText(false)).toBe('Bad landing site');
  });

  it('explains each case', () => {
    expect(whyText(true, true)).toMatch(/^Why good/);
    expect(whyText(false, false)).toMatch(/no solar power.*no direct radio/);
    expect(whyText(false, true)).toMatch(/Earth is in view/);
    expect(whyText(true, false)).toMatch(/relay satellite/);
  });

  it('labels a spot with hemispheres', () => {
    expect(spotLabel(-85.26, -30.04)).toBe('Spot 85.3°S, 30.0°W');
    expect(spotLabel(10, 20)).toBe('Spot 10.0°N, 20.0°E');
  });
});

describe('nearestSite', () => {
  const sites = [site('a', -89.5, 0), site('b', -86, 0)];

  it('picks the closest site within 2.2 degrees', () => {
    expect(nearestSite(sites, -88.9, 0)?.id).toBe('a');
    expect(nearestSite(sites, -86.5, 10)?.id).toBe('b');
  });

  it('returns null when every site is farther than 2.2 degrees', () => {
    expect(nearestSite(sites, -80, 0)).toBeNull();
    expect(nearestSite([], -89, 0)).toBeNull();
  });
});
