import * as THREE from 'three';

import { D2R } from '@/scene/units';

/*
 * The real skyline in the landed view. The API's terrain horizon (the
 * `horizon` of POST /analyze: one elevation per azimuth step, computed from
 * NASA LOLA grids) is drawn as a band of hills, and the decorative ground is
 * kept below it. The web app only draws the profile; the API decides what is
 * visible. Scene frame: x = east, y = up, z = -north, km (scene/units.ts).
 */

/** Distance of the skyline's crest from the viewer, km (beyond the 45 km decorative ground). */
export const CREST_KM = 60;
/** Distance of the band's foot, km; it runs under the decorative ground's outer rings. */
const FOOT_KM = 40;
/** Angle of the band's foot below the horizontal, degrees: far below any drawn ground. */
const FOOT_DEG = -10;
/** The decorative ground stays this far below the real horizon, degrees. */
export const GROUND_MARGIN_DEG = 0.2;

export interface HorizonProfile {
  /** Index i is azimuth i * azStepDeg; degrees above the local horizontal plane. */
  elevationDeg: readonly number[];
  azStepDeg: number;
}

/**
 * The horizon at any azimuth, by linear interpolation between profile entries,
 * wrapping at 360. The same rule as `horizon_at` in apps/api/app/engines/horizon.py.
 */
export function horizonAt(p: HorizonProfile, azDeg: number): number {
  const n = p.elevationDeg.length;
  const x = (((azDeg % 360) + 360) % 360) / p.azStepDeg;
  const i0 = Math.floor(x) % n;
  const f = x - Math.floor(x);
  const a = p.elevationDeg[i0] ?? 0;
  const b = p.elevationDeg[(i0 + 1) % n] ?? 0;
  return a * (1 - f) + b * f;
}

/** Azimuth of a scene point seen from the origin, degrees clockwise from north. */
export function azimuthOf(east: number, north: number): number {
  return (((Math.atan2(east, north) / D2R) % 360) + 360) % 360;
}

/** Highest the drawn ground may reach at a point, so it stays below the real horizon. */
export function groundCeiling(
  p: HorizonProfile,
  eyeY: number,
  east: number,
  north: number,
): number {
  const d = Math.hypot(east, north);
  const h = horizonAt(p, azimuthOf(east, north)) - GROUND_MARGIN_DEG;
  return eyeY + d * Math.tan(h * D2R);
}

/**
 * Lowers every vertex of the decorative ground that would rise above the real
 * horizon. Positions are x, y, z triples. Returns how many vertices moved.
 */
export function capGround(
  positions: Float32Array,
  p: HorizonProfile,
  eyeY: number,
): number {
  let moved = 0;
  for (let i = 0; i < positions.length; i += 3) {
    const east = positions[i]!;
    const north = -positions[i + 2]!;
    if (east === 0 && north === 0) continue;
    const top = groundCeiling(p, eyeY, east, north);
    if (positions[i + 1]! > top) {
      positions[i + 1] = top;
      moved++;
    }
  }
  return moved;
}

/**
 * A ring of hills whose crest is the real horizon: for each profile azimuth,
 * a crest vertex at CREST_KM at the horizon's elevation and a foot vertex at
 * FOOT_KM well below the drawn ground.
 */
export function skylineGeometry(
  p: HorizonProfile,
  eyeY: number,
): THREE.BufferGeometry {
  const n = p.elevationDeg.length;
  const pos = new Float32Array(n * 2 * 3);
  const footY = eyeY + FOOT_KM * Math.tan(FOOT_DEG * D2R);
  for (let i = 0; i < n; i++) {
    const a = i * p.azStepDeg * D2R;
    const sx = Math.sin(a);
    const cz = -Math.cos(a);
    const crestY = eyeY + CREST_KM * Math.tan((p.elevationDeg[i] ?? 0) * D2R);
    pos.set([sx * CREST_KM, crestY, cz * CREST_KM], i * 6);
    pos.set([sx * FOOT_KM, footY, cz * FOOT_KM], i * 6 + 3);
  }
  const idx: number[] = [];
  for (let i = 0; i < n; i++) {
    const c0 = i * 2;
    const f0 = c0 + 1;
    const c1 = ((i + 1) % n) * 2;
    const f1 = c1 + 1;
    // Wound so the faces look inward, toward the viewer.
    idx.push(c0, f0, c1, c1, f0, f1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
