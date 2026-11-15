import { describe, expect, it } from 'vitest';

import { D2R } from '@/scene/units';

import {
  CREST_KM,
  GROUND_MARGIN_DEG,
  azimuthOf,
  capGround,
  groundCeiling,
  horizonAt,
  skylineGeometry,
  type HorizonProfile,
} from './skyline';

// A profile one value per degree: 2 degrees everywhere except a 6 degree ridge due east.
const profile: HorizonProfile = {
  azStepDeg: 1,
  elevationDeg: Array.from({ length: 360 }, (_, i) => (i === 90 ? 6 : 2)),
};

describe('horizonAt', () => {
  it('interpolates between entries and wraps at 360', () => {
    expect(horizonAt(profile, 90)).toBe(6);
    expect(horizonAt(profile, 89.5)).toBeCloseTo(4);
    expect(horizonAt(profile, 450)).toBe(6);
    expect(horizonAt(profile, -270)).toBe(6);
  });
});

describe('azimuthOf', () => {
  it('measures clockwise from north', () => {
    expect(azimuthOf(0, 1)).toBeCloseTo(0);
    expect(azimuthOf(1, 0)).toBeCloseTo(90);
    expect(azimuthOf(0, -1)).toBeCloseTo(180);
    expect(azimuthOf(-1, 0)).toBeCloseTo(270);
  });
});

describe('capGround', () => {
  it('lowers only the vertices above the real horizon', () => {
    const eyeY = 0.003;
    // x = east, y = up, z = -north. A 1 km high hill 10 km north (above 2 degrees),
    // and a 0.1 km rise 10 km east (below the 6 degree ridge).
    const pos = new Float32Array([0, 0, 0, 0, 1, -10, 10, 0.1, 0]);
    expect(capGround(pos, profile, eyeY)).toBe(1);
    const north = Math.atan2(pos[4]! - eyeY, 10) / D2R;
    expect(north).toBeCloseTo(2 - GROUND_MARGIN_DEG, 6);
    expect(pos[7]).toBeCloseTo(0.1);
    expect(pos[1]).toBe(0);
  });

  it('keeps the ceiling below the horizon in every direction', () => {
    for (const az of [0, 45, 90, 200]) {
      const e = Math.sin(az * D2R) * 5;
      const n = Math.cos(az * D2R) * 5;
      const top = groundCeiling(profile, 0, e, n);
      expect(Math.atan2(top, 5) / D2R).toBeLessThan(horizonAt(profile, az));
    }
  });
});

describe('skylineGeometry', () => {
  it('puts each crest vertex at the horizon elevation in its direction', () => {
    const eyeY = 0.003;
    const g = skylineGeometry(profile, eyeY);
    const pos = g.getAttribute('position');
    expect(pos.count).toBe(720);
    for (const i of [0, 90, 180]) {
      const x = pos.getX(i * 2);
      const y = pos.getY(i * 2);
      const z = pos.getZ(i * 2);
      expect(Math.hypot(x, z)).toBeCloseTo(CREST_KM, 4);
      expect(azimuthOf(x, -z)).toBeCloseTo(i, 4);
      expect(Math.atan2(y - eyeY, CREST_KM) / D2R).toBeCloseTo(
        profile.elevationDeg[i]!,
        4,
      );
    }
    expect(g.getIndex()?.count).toBe(360 * 6);
  });
});
