/*
 * Drawing math for the elevation map on the site page. The heights are the API's
 * (GET /terrain); this file only turns them into colours and a scale bar.
 *
 * Shading: the brightness of each sample is the cosine of the angle between the ground's
 * normal and the direction of a light, as for a diffuse surface (Lambert's cosine law,
 * https://en.wikipedia.org/wiki/Lambert%27s_cosine_law, read 2026-11-15). The light comes from
 * the north-west, the usual choice for shaded relief maps with north up, so that hills do not
 * look like hollows (https://en.wikipedia.org/wiki/Terrain_cartography, "Shaded relief", read
 * 2026-11-15, citing Imhof, Cartographic relief presentation, 2007). This light is for
 * reading the shape of the ground only; it is not the Sun.
 */

/** Colour stops from low to high ground, chosen by the team for this map. */
export const RAMP: readonly (readonly [number, number, number])[] = [
  [29, 43, 83],
  [59, 110, 143],
  [94, 211, 199],
  [216, 195, 138],
  [245, 239, 224],
];

/** The ramp's colour at t in 0..1, linearly between stops. */
export function rampColour(t: number): [number, number, number] {
  const x = Math.min(1, Math.max(0, Number.isFinite(t) ? t : 0));
  const pos = x * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, Math.floor(pos));
  const f = pos - i;
  const a = RAMP[i]!;
  const b = RAMP[i + 1]!;
  return [0, 1, 2].map((k) => Math.round(a[k]! + (b[k]! - a[k]!) * f)) as [
    number,
    number,
    number,
  ];
}

/** CSS gradient of the ramp, for the legend. */
export function rampGradient(): string {
  const stops = RAMP.map(
    (c, i) => `rgb(${c.join(' ')}) ${(i / (RAMP.length - 1)) * 100}%`,
  );
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}

/** Light direction: from azimuth 315 (north-west), 45 degrees above the horizontal. */
const LIGHT_AZ = (315 * Math.PI) / 180;
const LIGHT_ALT = (45 * Math.PI) / 180;
/** Heights are multiplied by this before shading, so gentle slopes still show. */
export const SHADE_EXAGGERATION = 3;

/**
 * Brightness 0..1 at each sample of an n by n grid (row 0 north, column 0 west).
 * Missing samples (null) get NaN.
 */
export function hillshade(
  heights: readonly (readonly (number | null)[])[],
  spacingM: number,
  exaggeration = SHADE_EXAGGERATION,
): number[][] {
  const n = heights.length;
  const at = (i: number, j: number, fallback: number): number => {
    const v =
      heights[Math.min(n - 1, Math.max(0, i))]?.[
        Math.min(n - 1, Math.max(0, j))
      ];
    return v == null ? fallback : v;
  };
  // Light vector in (east, north, up).
  const lx = Math.cos(LIGHT_ALT) * Math.sin(LIGHT_AZ);
  const ly = Math.cos(LIGHT_ALT) * Math.cos(LIGHT_AZ);
  const lz = Math.sin(LIGHT_ALT);
  return heights.map((row, i) =>
    row.map((h, j) => {
      if (h == null) return NaN;
      // Central differences; rows grow toward the south, so north is i - 1.
      const dzdx =
        ((at(i, j + 1, h) - at(i, j - 1, h)) * exaggeration) / (2 * spacingM);
      const dzdy =
        ((at(i - 1, j, h) - at(i + 1, j, h)) * exaggeration) / (2 * spacingM);
      // Normal of z = f(x, y) is (-dz/dx, -dz/dy, 1), normalised.
      const len = Math.hypot(dzdx, dzdy, 1);
      const cos = (-dzdx * lx - dzdy * ly + lz) / len;
      return Math.max(0, cos);
    }),
  );
}

/**
 * RGBA pixels for an n by n canvas: the colour of the height, darkened by the shading.
 * Missing samples are transparent.
 */
export function reliefPixels(
  heights: readonly (readonly (number | null)[])[],
  spacingM: number,
  minM: number,
  maxM: number,
): Uint8ClampedArray {
  const n = heights.length;
  const shade = hillshade(heights, spacingM);
  const flat = Math.sin(LIGHT_ALT); // the brightness of level ground
  const span = maxM - minM || 1;
  const out = new Uint8ClampedArray(n * n * 4);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const h = heights[i]?.[j];
      const k = (i * n + j) * 4;
      if (h == null) continue;
      const [r, g, b] = rampColour((h - minM) / span);
      // Level ground keeps its ramp colour; slopes toward the light are brighter.
      const s = Math.min(
        1.35,
        Math.max(0.35, (shade[i]![j]! / flat) * 0.85 + 0.15),
      );
      out[k] = r * s;
      out[k + 1] = g * s;
      out[k + 2] = b * s;
      out[k + 3] = 255;
    }
  }
  return out;
}

/** A round scale-bar length (1, 2 or 5 times a power of ten, km) near a quarter of the width. */
export function scaleBarKm(widthKm: number): number {
  const target = widthKm / 4;
  if (!(target > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(target));
  const m = target / p;
  return (m >= 5 ? 5 : m >= 2 ? 2 : 1) * p;
}

/** Plain name of the elevation grid the API used, from its name and pixel size. */
export function gridName(source: string, resolutionM: number): string {
  const ppd = /^lola-global-(\d+)ppd$/.exec(source)?.[1];
  if (ppd) {
    return `NASA LOLA global grid, ${ppd} pixels per degree (about ${(resolutionM / 1000).toFixed(1)} km at the equator)`;
  }
  return `NASA LOLA south polar grid, ${Math.round(resolutionM)} m pixels`;
}
