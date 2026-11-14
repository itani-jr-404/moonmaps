/*
 * Decorative relief for the 3D views only. Visibility and horizons come from
 * the API (real LOLA terrain); this never decides whether the Sun or the Earth
 * is visible.
 *
 * Value noise summed over a few octaves, evaluated at surface points given in
 * kilometres. Deterministic, so the same site always looks the same.
 */

import { D2R } from './units';

/**
 * Mean lunar radius in km: the LOLA reference sphere, also the sphere JPL
 * Horizons uses. Source: docs/science/conventions-and-ephemeris.md.
 */
export const MOON_R = 1737.4;

export type Vec3Tuple = [number, number, number];

/** Local frame at a surface point: p = up (unit radial), e = east, n = north. */
export interface SurfaceBasis {
  p: Vec3Tuple;
  e: Vec3Tuple;
  n: Vec3Tuple;
}

function hash3(x: number, y: number, z: number): number {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function vnoise(x: number, y: number, z: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  let xf = x - xi;
  let yf = y - yi;
  let zf = z - zi;
  xf = xf * xf * (3 - 2 * xf);
  yf = yf * yf * (3 - 2 * yf);
  zf = zf * zf * (3 - 2 * zf);
  return lerp(
    lerp(
      lerp(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), xf),
      lerp(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), xf),
      yf,
    ),
    lerp(
      lerp(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), xf),
      lerp(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), xf),
      yf,
    ),
    zf,
  );
}

/** Octaves as [wavelength km, amplitude km]. */
const OCT: ReadonlyArray<readonly [number, number]> = [
  [48, 1.7],
  [17, 0.75],
  [6, 0.28],
  [2.2, 0.09],
];

export const RELIEF_OCTAVES = OCT.length;

function octaves(x: number, y: number, z: number, count: number): number {
  let h = 0;
  for (let i = 0; i < count && i < OCT.length; i++) {
    const [w, a] = OCT[i]!;
    h += a * (vnoise(x / w + 31.7, y / w - 11.3, z / w + 5.1) * 2 - 1);
  }
  return h;
}

/** Decorative height in km at a surface point given as km coordinates. */
export function reliefKm(x: number, y: number, z: number): number {
  return octaves(x, y, z, OCT.length);
}

/**
 * Local east/north/up frame at a site. This frame is z-up (body-fixed), not
 * the y-up scene frame used by units.ts; it only feeds the noise lookups.
 */
export function basis(latDeg: number, lonDeg: number): SurfaceBasis {
  const cl = Math.cos(latDeg * D2R);
  const sl = Math.sin(latDeg * D2R);
  const co = Math.cos(lonDeg * D2R);
  const so = Math.sin(lonDeg * D2R);
  return {
    p: [cl * co, cl * so, sl],
    e: [-so, co, 0],
    n: [-sl * co, -sl * so, cl],
  };
}

/** Decorative height in km at a latitude and longitude (degrees). */
export function heightAtKm(
  latDeg: number,
  lonDeg: number,
  octaveCount = RELIEF_OCTAVES,
): number {
  const b = basis(latDeg, lonDeg);
  return octaves(
    b.p[0] * MOON_R,
    b.p[1] * MOON_R,
    b.p[2] * MOON_R,
    octaveCount,
  );
}
