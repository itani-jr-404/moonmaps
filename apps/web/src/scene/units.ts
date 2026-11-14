import * as THREE from 'three';

/*
 * Angle and direction helpers shared by every 3D view.
 * Conventions (docs/science/conventions-and-ephemeris.md): degrees, azimuth
 * clockwise from north, east-positive longitude.
 */

export const D2R = Math.PI / 180;
export const R2D = 180 / Math.PI;

/**
 * Unit vector in the local scene frame for a sky direction.
 * The scene frame is x = east, y = up, z = -north (three.js is y-up and the
 * camera looks down -z, so north is "into the screen").
 */
export function enuToVector(azDeg: number, elDeg: number): THREE.Vector3 {
  const ce = Math.cos(elDeg * D2R);
  return new THREE.Vector3(
    ce * Math.sin(azDeg * D2R),
    Math.sin(elDeg * D2R),
    -ce * Math.cos(azDeg * D2R),
  );
}

/**
 * Point on a globe of radius `r` in the globe's local frame: y is the north
 * pole, +x is longitude 0, and -z is longitude +90 (east). This matches how
 * the LROC equirectangular map wraps onto THREE.SphereGeometry.
 */
export function latLonToVector(
  latDeg: number,
  lonDeg: number,
  r = 1,
): THREE.Vector3 {
  const a = latDeg * D2R;
  const o = lonDeg * D2R;
  return new THREE.Vector3(
    r * Math.cos(a) * Math.cos(o),
    r * Math.sin(a),
    -r * Math.cos(a) * Math.sin(o),
  );
}

/** Inverse of latLonToVector for any non-zero vector in the globe's local frame. */
export function vectorToLatLon(v: THREE.Vector3): { lat: number; lon: number } {
  const p = v.clone().normalize();
  // Clamp guards asin against rounding just past +-1.
  const y = Math.min(1, Math.max(-1, p.y));
  return { lat: Math.asin(y) * R2D, lon: Math.atan2(-p.z, p.x) * R2D };
}
