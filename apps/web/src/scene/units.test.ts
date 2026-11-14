import { describe, expect, it } from 'vitest';

import { enuToVector, latLonToVector, vectorToLatLon } from './units';

describe('latLonToVector and vectorToLatLon', () => {
  it.each([
    [0, 0],
    [-89.5, 45],
    [45, -120],
    [10, 179],
    [-30, 90],
    [60, -90],
  ])('round-trips lat %d, lon %d', (lat, lon) => {
    const back = vectorToLatLon(latLonToVector(lat, lon, 3));
    expect(back.lat).toBeCloseTo(lat, 9);
    expect(back.lon).toBeCloseTo(lon, 9);
  });

  it('puts lon 0 on +x, lon +90 (east) on -z and the north pole on +y', () => {
    const v0 = latLonToVector(0, 0);
    expect(v0.x).toBeCloseTo(1);
    expect(v0.z).toBeCloseTo(0);
    expect(latLonToVector(0, 90).z).toBeCloseTo(-1);
    expect(latLonToVector(90, 0).y).toBeCloseTo(1);
  });
});

describe('enuToVector', () => {
  it('points north (-z) at azimuth 0 on the horizon', () => {
    const v = enuToVector(0, 0);
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(0);
    expect(v.z).toBeCloseTo(-1);
  });

  it('points east (+x) at azimuth 90 on the horizon', () => {
    const v = enuToVector(90, 0);
    expect(v.x).toBeCloseTo(1);
    expect(v.y).toBeCloseTo(0);
    expect(v.z).toBeCloseTo(0);
  });

  it('points straight up (+y) at elevation 90 for any azimuth', () => {
    for (const az of [0, 90, 213]) {
      const v = enuToVector(az, 90);
      expect(v.x).toBeCloseTo(0);
      expect(v.y).toBeCloseTo(1);
      expect(v.z).toBeCloseTo(0);
    }
  });
});
