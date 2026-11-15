import { describe, expect, it } from 'vitest';
import {
  RAMP,
  gridName,
  hillshade,
  rampColour,
  reliefPixels,
  scaleBarKm,
} from './relief';

describe('rampColour', () => {
  it('gives the end stops at 0 and 1 and clamps outside', () => {
    expect(rampColour(0)).toEqual([...RAMP[0]!]);
    expect(rampColour(1)).toEqual([...RAMP[RAMP.length - 1]!]);
    expect(rampColour(-2)).toEqual(rampColour(0));
    expect(rampColour(Number.NaN)).toEqual(rampColour(0));
  });
});

describe('hillshade', () => {
  it('gives the same brightness everywhere on level ground', () => {
    const flat = [
      [5, 5, 5],
      [5, 5, 5],
      [5, 5, 5],
    ];
    const s = hillshade(flat, 100).flat();
    expect(new Set(s.map((v) => v.toFixed(6))).size).toBe(1);
    expect(s[0]).toBeCloseTo(Math.SQRT1_2, 6);
  });

  it('lights a slope facing north-west more than one facing south-east', () => {
    // Ground rising toward the south-east faces the north-west light.
    const up = [
      [0, 10, 20],
      [10, 20, 30],
      [20, 30, 40],
    ];
    const down = up.map((row) => row.map((v) => -v));
    expect(hillshade(up, 10)[1]![1]!).toBeGreaterThan(
      hillshade(down, 10)[1]![1]!,
    );
  });

  it('marks missing samples', () => {
    expect(
      Number.isNaN(
        hillshade(
          [
            [null, 1],
            [1, 1],
          ],
          10,
        )[0]![0]!,
      ),
    ).toBe(true);
  });
});

describe('reliefPixels', () => {
  it('writes opaque pixels for heights and transparent ones for gaps', () => {
    const px = reliefPixels(
      [
        [0, null],
        [10, 20],
      ],
      100,
      0,
      20,
    );
    expect(px.length).toBe(16);
    expect(px[3]).toBe(255);
    expect(px[7]).toBe(0);
  });
});

describe('scaleBarKm', () => {
  it('picks 1, 2 or 5 times a power of ten near a quarter of the width', () => {
    expect(scaleBarKm(60)).toBe(10);
    expect(scaleBarKm(20)).toBe(5);
    expect(scaleBarKm(10)).toBe(2);
    expect(scaleBarKm(300)).toBe(50);
  });
});

describe('gridName', () => {
  it('names the polar and the global grids', () => {
    expect(gridName('lola-80s-80m', 80)).toBe(
      'NASA LOLA south polar grid, 80 m pixels',
    );
    expect(gridName('lola-global-16ppd', 1895.21)).toBe(
      'NASA LOLA global grid, 16 pixels per degree (about 1.9 km at the equator)',
    );
  });
});
