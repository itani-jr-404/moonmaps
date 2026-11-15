import { describe, expect, it } from 'vitest';

import { safeHref } from './linkify';
import { NASA_RESOURCES } from './resources';

const all = NASA_RESOURCES.flatMap((g) => g.items);

describe('NASA_RESOURCES', () => {
  it('lists only Moon Trek and the Horizons System', () => {
    expect(all.map((r) => r.href)).toEqual([
      'https://trek.nasa.gov/moon/',
      'https://ssd.jpl.nasa.gov/horizons/',
    ]);
  });

  it('has no Space Apps pages', () => {
    for (const r of all) {
      expect(new URL(r.href).hostname).not.toMatch(/spaceappschallenge/);
      expect(r.owner).not.toMatch(/Space Apps/);
    }
  });

  it('only links to hosts the chat may also link to', () => {
    for (const r of all) expect(safeHref(r.href)).toBe(r.href);
  });
});
