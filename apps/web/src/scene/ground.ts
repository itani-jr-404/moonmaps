import * as THREE from 'three';

import { basis, MOON_R, reliefKm, type SurfaceBasis } from './relief';

/*
 * Decorative relief for the 3D views only. Visibility and horizons come from
 * the API (real LOLA terrain); this never decides whether the Sun or the Earth
 * is visible.
 *
 * Close-up ground around a site: the smooth relief from relief.ts plus
 * procedural craters with the bowl, raised rim and ejecta profile of real
 * lunar craters (depth about 0.2 D, rim about 0.04 D; proportions from the prototype, source
 * to confirm; the ground is decorative and never used for visibility), and a tiling regolith
 * detail map. Curvature is real, so from eye height the horizon is only a few
 * kilometres away. All distances are in km.
 */

const R = MOON_R;

function h3(x: number, y: number, z: number): number {
  let h = (x * 374761393 + y * 668265263 + z * 1440662683) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** [cell size km, probability of a crater per cell, min radius km, max radius km] */
export type CraterScale = readonly [number, number, number, number];

/** All crater sizes, down to metres: for the eye-level view. */
export const FULL: readonly CraterScale[] = [
  [9, 0.32, 0.8, 4],
  [2.2, 0.42, 0.14, 0.9],
  [0.5, 0.5, 0.03, 0.2],
  [0.11, 0.55, 0.006, 0.045],
];
/** Without the smallest craters: for the diorama, where they would be sub-pixel. */
export const MID: readonly CraterScale[] = FULL.slice(0, 3);

function craters(
  x: number,
  y: number,
  z: number,
  scales: readonly CraterScale[],
): [height: number, fresh: number] {
  let h = 0;
  let fresh = 0;
  for (let s = 0; s < scales.length; s++) {
    const [cell, prob, rmin, rmax] = scales[s]!;
    const sd = s * 977 + 13;
    const cx = Math.floor(x / cell);
    const cy = Math.floor(y / cell);
    const cz = Math.floor(z / cell);
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++)
        for (let k = -1; k <= 1; k++) {
          const a = cx + i;
          const b = cy + j;
          const c = cz + k;
          if (h3(a + sd, b, c) > prob) continue;
          let ox = (a + h3(a, b + sd, c + 11)) * cell;
          let oy = (b + h3(a + 5, b, c + sd)) * cell;
          let oz = (c + h3(a, b + 9, c + sd)) * cell;
          const ol = Math.hypot(ox, oy, oz);
          ox *= R / ol;
          oy *= R / ol;
          oz *= R / ol;
          const r =
            rmin + (rmax - rmin) * Math.pow(h3(a + 3, b + sd, c + 7), 2.2);
          const dx = x - ox;
          const dy = y - oy;
          const dz = z - oz;
          const d2 = (dx * dx + dy * dy + dz * dz) / (r * r);
          if (d2 > 9) continue;
          const d = Math.sqrt(d2);
          const f = 0.3 + 0.7 * h3(a, b + 1, c + sd + 3);
          let v = d < 1 ? (d2 - 1) * 0.2 * f : 0;
          const rim = Math.exp(-(((d - 1) / 0.22) ** 2));
          v += 0.05 * f * rim;
          if (d > 1) v += 0.014 * f * Math.exp(-(d - 1) * 2.2);
          h += v * r;
          if (s >= 2) fresh = Math.max(fresh, f * rim);
        }
  }
  return [h, fresh];
}

/** Result of `at`: height km, fresh-rim factor 0..1, and the surface point in km. */
export type GroundSample = [
  height: number,
  fresh: number,
  qx: number,
  qy: number,
  qz: number,
];

/** Ground height (km) at `east`, `north` km from the site whose frame is `b`. */
export function at(
  b: SurfaceBasis,
  east: number,
  north: number,
  scales: readonly CraterScale[],
  terrainOn: boolean,
): GroundSample {
  let qx = b.p[0] + (b.e[0] * east + b.n[0] * north) / R;
  let qy = b.p[1] + (b.e[1] * east + b.n[1] * north) / R;
  let qz = b.p[2] + (b.e[2] * east + b.n[2] * north) / R;
  const ql = Math.hypot(qx, qy, qz);
  qx *= R / ql;
  qy *= R / ql;
  qz *= R / ql;
  const [cr, fresh] = craters(qx, qy, qz, scales);
  return [(terrainOn ? reliefKm(qx, qy, qz) : 0) + cr, fresh, qx, qy, qz];
}

/** Lunar highland grey with a slight warm cast, brighter on fresh crater rims. */
export function albedo(
  fresh: number,
  qx: number,
  qy: number,
  qz: number,
): number {
  const n = reliefKm(qx * 3.1, qy * 3.1, qz * 3.1) * 0.035;
  return 0.3 + n + fresh * 0.09;
}

interface DetailTextures {
  normal: THREE.CanvasTexture;
  albedo: THREE.CanvasTexture;
}

let detail: DetailTextures | null = null;

/**
 * Tiling regolith detail: a height field with tiny craters and grain, turned
 * into a normal map and an albedo map. Built on first use (browser only).
 */
function detailTextures(): DetailTextures {
  if (detail) return detail;
  const N = 512;
  const hgt = new Float32Array(N * N);
  const rnd = (i: number) => h3(i, 7, 3);
  const vn = (x: number, y: number, L: number, seed: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const sx = xf * xf * (3 - 2 * xf);
    const sy = yf * yf * (3 - 2 * yf);
    const g = (a: number, b: number) =>
      h3(((a % L) + L) % L, ((b % L) + L) % L, seed);
    return (
      (g(xi, yi) * (1 - sx) + g(xi + 1, yi) * sx) * (1 - sy) +
      (g(xi, yi + 1) * (1 - sx) + g(xi + 1, yi + 1) * sx) * sy
    );
  };
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let v = 0;
      let a = 1;
      let L = 8;
      for (let o = 0; o < 5; o++) {
        v += a * vn((x / N) * L, (y / N) * L, L, o + 1);
        a *= 0.5;
        L *= 2;
      }
      hgt[y * N + x] = v * 0.5;
    }
  for (let i = 0; i < 260; i++) {
    const cx = rnd(i * 3) * N;
    const cy = rnd(i * 3 + 1) * N;
    const r = 3 + Math.pow(rnd(i * 3 + 2), 2.5) * 34;
    const f = 0.4 + 0.6 * rnd(i + 999);
    for (let y = Math.floor(cy - r * 2); y <= cy + r * 2; y++)
      for (let x = Math.floor(cx - r * 2); x <= cx + r * 2; x++) {
        const d = Math.hypot(x - cx, y - cy) / r;
        if (d > 2) continue;
        const k = (((y % N) + N) % N) * N + (((x % N) + N) % N);
        hgt[k] =
          hgt[k]! +
          f *
            r *
            0.06 *
            ((d < 1 ? (d * d - 1) * 0.5 : 0) +
              0.25 * Math.exp(-(((d - 1) / 0.25) ** 2)));
      }
  }
  const nc = document.createElement('canvas');
  const ac = document.createElement('canvas');
  nc.width = nc.height = ac.width = ac.height = N;
  const ng = nc.getContext('2d');
  const ag = ac.getContext('2d');
  if (ng && ag) {
    const ni = ng.createImageData(N, N);
    const ai = ag.createImageData(N, N);
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const k = y * N + x;
        const l = y * N + ((x + N - 1) % N);
        const r = y * N + ((x + 1) % N);
        const u = ((y + N - 1) % N) * N + x;
        const dn = ((y + 1) % N) * N + x;
        let nx = (hgt[l]! - hgt[r]!) * 2.2;
        let ny = (hgt[u]! - hgt[dn]!) * 2.2;
        let nz = 1;
        const nl = Math.hypot(nx, ny, nz);
        nx /= nl;
        ny /= nl;
        nz /= nl;
        ni.data[k * 4] = (nx * 0.5 + 0.5) * 255;
        ni.data[k * 4 + 1] = (ny * 0.5 + 0.5) * 255;
        ni.data[k * 4 + 2] = (nz * 0.5 + 0.5) * 255;
        ni.data[k * 4 + 3] = 255;
        const g = Math.max(
          0,
          Math.min(
            255,
            (0.92 + (hgt[k]! - 0.5) * 0.25 + (h3(x, y, 5) - 0.5) * 0.06) * 235,
          ),
        );
        ai.data[k * 4] = g;
        ai.data[k * 4 + 1] = g * 0.985;
        ai.data[k * 4 + 2] = g * 0.96;
        ai.data[k * 4 + 3] = 255;
      }
    ng.putImageData(ni, 0, 0);
    ag.putImageData(ai, 0, 0);
  }
  const mk = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  detail = { normal: mk(nc, false), albedo: mk(ac, true) };
  return detail;
}

/**
 * Ground material: per-vertex albedo times the tiling detail maps. Browser
 * only. The detail textures are shared by every ground material.
 */
export function groundMaterial(normalScale = 1.1): THREE.MeshStandardMaterial {
  const d = detailTextures();
  return new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: d.albedo,
    normalMap: d.normal,
    normalScale: new THREE.Vector2(normalScale, normalScale),
    roughness: 1,
    metalness: 0,
  });
}

export interface PolarGroundOptions {
  /** Radius of the first ring, km. */
  r0?: number;
  /** Radius of the last ring, km. */
  rMax?: number;
  rings?: number;
  segs?: number;
  /** Detail-map tile size, km. */
  tile?: number;
  scales?: readonly CraterScale[];
  terrainOn?: boolean;
}

export interface PolarGround {
  geometry: THREE.BufferGeometry;
  /** Scene-space height (km, curvature drop included) at a point east/north of the site. */
  heightAt: (east: number, north: number) => number;
}

/**
 * Eye-level ground around a site: a polar grid with logarithmic ring spacing,
 * dense under the observer and sparse toward the horizon. Scene frame:
 * x = east, y = up, z = -north, origin on the ground at the site.
 */
export function polarGround(
  lat: number,
  lon: number,
  {
    r0 = 0.002,
    rMax = 45,
    rings = 230,
    segs = 320,
    tile = 0.03,
    scales = FULL,
    terrainOn = true,
  }: PolarGroundOptions = {},
): PolarGround {
  const b = basis(lat, lon);
  const [h0] = at(b, 0, 0, scales, terrainOn);
  const k = Math.log(rMax / r0) / (rings - 1);
  const nV = 1 + rings * segs;
  const pos = new Float32Array(nV * 3);
  const col = new Float32Array(nV * 3);
  const uv = new Float32Array(nV * 2);
  const put = (i: number, east: number, north: number) => {
    const [h, fresh, qx, qy, qz] = at(b, east, north, scales, terrainOn);
    const d2 = east * east + north * north;
    pos[i * 3] = east;
    pos[i * 3 + 1] = h - h0 - d2 / (2 * R);
    pos[i * 3 + 2] = -north;
    const a = albedo(fresh, qx, qy, qz);
    col[i * 3] = a * 1.02;
    col[i * 3 + 1] = a;
    col[i * 3 + 2] = a * 0.95;
    uv[i * 2] = east / tile;
    uv[i * 2 + 1] = north / tile;
  };
  put(0, 0, 0);
  for (let i = 0; i < rings; i++) {
    const r = r0 * Math.exp(k * i);
    for (let s = 0; s < segs; s++) {
      const a = (s / segs) * Math.PI * 2;
      put(1 + i * segs + s, r * Math.sin(a), r * Math.cos(a));
    }
  }
  const idx = new Uint32Array(segs * 3 + (rings - 1) * segs * 6);
  let n = 0;
  for (let s = 0; s < segs; s++) {
    idx[n++] = 0;
    idx[n++] = 1 + ((s + 1) % segs);
    idx[n++] = 1 + s;
  }
  for (let i = 0; i < rings - 1; i++)
    for (let s = 0; s < segs; s++) {
      const a = 1 + i * segs + s;
      const b2 = 1 + i * segs + ((s + 1) % segs);
      const c = a + segs;
      const d = b2 + segs;
      idx[n++] = a;
      idx[n++] = b2;
      idx[n++] = c;
      idx[n++] = b2;
      idx[n++] = d;
      idx[n++] = c;
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(new THREE.BufferAttribute(idx, 1));
  geometry.computeVertexNormals();
  return {
    geometry,
    heightAt: (east, north) =>
      at(b, east, north, scales, terrainOn)[0] -
      h0 -
      (east * east + north * north) / (2 * R),
  };
}

export interface SlabGroundOptions {
  /** Half the side of the square, km. */
  half?: number;
  /** Grid cells per side. */
  N?: number;
  /** Vertical exaggeration. */
  ex?: number;
  /** Detail-map tile size, km. */
  tile?: number;
  scales?: readonly CraterScale[];
  terrainOn?: boolean;
  /** Extra height (km) of a Gaussian bump centred on the site. */
  relief?: number;
}

/**
 * Square diorama slab around a site, with its edge pulled down to a skirt so
 * it reads as a cut-out model. Scene frame: x = east, y = up, z = -north.
 */
export function slabGround(
  lat: number,
  lon: number,
  {
    half = 12,
    N = 200,
    ex = 2,
    tile = 0.4,
    scales = MID,
    terrainOn = true,
    relief = 0,
  }: SlabGroundOptions = {},
): THREE.BufferGeometry {
  const b = basis(lat, lon);
  const [h0] = at(b, 0, 0, scales, terrainOn);
  const BASE = -2.4;
  const g = new THREE.PlaneGeometry(half * 2, half * 2, N, N);
  g.rotateX(-Math.PI / 2);
  const p = g.getAttribute('position');
  const uv = g.getAttribute('uv');
  const col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    const edge =
      Math.abs(Math.abs(x) - half) < 1e-6 ||
      Math.abs(Math.abs(z) - half) < 1e-6;
    const [h, fresh, qx, qy, qz] = at(b, x, -z, scales, terrainOn);
    let y =
      (h -
        h0 +
        relief * Math.exp(-(x * x + z * z) / 18) -
        (x * x + z * z) / (2 * R)) *
      ex;
    let a = albedo(fresh, qx, qy, qz);
    if (edge) {
      y = BASE;
      a = 0.025;
    }
    p.setY(i, y);
    col[i * 3] = a * 1.02;
    col[i * 3 + 1] = a;
    col[i * 3 + 2] = a * 0.95;
    uv.setXY(i, x / tile, -z / tile);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}
