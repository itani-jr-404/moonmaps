import { describe, expect, it } from 'vitest';
import {
  azToX,
  elToY,
  fitElevation,
  skylinePath,
  trackPaths,
  type PanoramaFrame,
} from './panorama';

const frame: PanoramaFrame = { width: 360, height: 100, minEl: -5, maxEl: 5 };

describe('panorama math', () => {
  it('maps azimuth left to right and wraps past north', () => {
    expect(azToX(0, frame)).toBe(0);
    expect(azToX(180, frame)).toBe(180);
    expect(azToX(-90, frame)).toBe(270);
    expect(azToX(450, frame)).toBe(90);
  });

  it('maps elevation bottom to top and clamps to the frame', () => {
    expect(elToY(-5, frame)).toBe(100);
    expect(elToY(5, frame)).toBe(0);
    expect(elToY(0, frame)).toBe(50);
    expect(elToY(40, frame)).toBe(0);
  });

  it('fits a range that includes the flat horizon and at least four degrees', () => {
    expect(fitElevation([0.5, 1, 1.5])).toEqual({ minEl: -3, maxEl: 4 });
    expect(fitElevation([-3, 8])).toEqual({ minEl: -4, maxEl: 9 });
    expect(fitElevation([])).toEqual({ minEl: -3, maxEl: 3 });
  });

  it('closes the skyline along the bottom and repeats north at 360', () => {
    const d = skylinePath([0, 5, -5, 0], 90, frame);
    expect(d.startsWith('M0,100 L0,50 L90,0 L180,100 L270,50 L360,50')).toBe(
      true,
    );
    expect(d.endsWith('L360,100 Z')).toBe(true);
    expect(skylinePath([], 1, frame)).toBe('');
  });

  it('cuts a track where the azimuth wraps past north', () => {
    const paths = trackPaths([350, 355, 2, 8], [0, 0, 0, 0], frame);
    expect(paths).toEqual(['M350,50 L355,50', 'M2,50 L8,50']);
    expect(trackPaths([10], [0], frame)).toEqual([]);
    expect(trackPaths([1, 2, 3, 4, 5], [0, 0, NaN, 0, 0], frame)).toEqual([
      'M1,50 L2,50',
      'M4,50 L5,50',
    ]);
  });
});
