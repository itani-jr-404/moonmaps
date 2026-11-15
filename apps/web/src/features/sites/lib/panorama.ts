/*
 * Drawing math for the horizon panorama on the site page. Azimuth runs left to
 * right from 0 to 360 degrees (clockwise from north), elevation bottom to top.
 * The numbers drawn are the API's terrain horizon (result.horizon) and its
 * Sun and Earth az/el series; this file only maps them to SVG coordinates.
 */

export interface PanoramaFrame {
  width: number;
  height: number;
  /** Lowest elevation shown, degrees. */
  minEl: number;
  /** Highest elevation shown, degrees. */
  maxEl: number;
}

export function azToX(az: number, frame: PanoramaFrame): number {
  const a = ((az % 360) + 360) % 360;
  return (a / 360) * frame.width;
}

export function elToY(el: number, frame: PanoramaFrame): number {
  const t = (el - frame.minEl) / (frame.maxEl - frame.minEl);
  return frame.height * (1 - Math.min(1, Math.max(0, t)));
}

/** An elevation range that fits the skyline and the paths, with a little room above and below. */
export function fitElevation(
  values: readonly number[],
  pad = 1,
): { minEl: number; maxEl: number } {
  const finite = values.filter(Number.isFinite);
  let lo = finite.length ? Math.min(...finite) : -1;
  let hi = finite.length ? Math.max(...finite) : 1;
  lo = Math.min(lo, 0);
  hi = Math.max(hi, 0);
  if (hi - lo < 4) {
    const mid = (hi + lo) / 2;
    lo = mid - 2;
    hi = mid + 2;
  }
  return { minEl: Math.floor(lo - pad), maxEl: Math.ceil(hi + pad) };
}

const f = (v: number) => Math.round(v * 10) / 10;

/**
 * A closed SVG path for the terrain: the horizon elevation at each azimuth step,
 * closed along the bottom edge. The first point is repeated at 360 degrees.
 */
export function skylinePath(
  elevationDeg: readonly number[],
  azStepDeg: number,
  frame: PanoramaFrame,
): string {
  if (elevationDeg.length === 0) return '';
  const pts = elevationDeg.map(
    (el, i) =>
      `${f((i * azStepDeg * frame.width) / 360)},${f(elToY(el, frame))}`,
  );
  pts.push(`${f(frame.width)},${f(elToY(elevationDeg[0]!, frame))}`);
  return `M0,${f(frame.height)} L${pts.join(' L')} L${f(frame.width)},${f(frame.height)} Z`;
}

/**
 * Open SVG paths for a body's track across the sky. The track is cut where the
 * azimuth wraps past north (a jump of more than 180 degrees), so no line
 * crosses the whole picture. A missing value (NaN) also cuts it, so callers
 * can hide the parts of a track that fall below the picture.
 */
export function trackPaths(
  az: readonly number[],
  el: readonly number[],
  frame: PanoramaFrame,
): string[] {
  const paths: string[] = [];
  let current: string[] = [];
  for (let i = 0; i < az.length && i < el.length; i++) {
    const a = az[i]!;
    const e = el[i]!;
    const gap = !Number.isFinite(a) || !Number.isFinite(e);
    if (gap || (i > 0 && Math.abs(a - az[i - 1]!) > 180 && current.length)) {
      if (current.length > 1) paths.push(`M${current.join(' L')}`);
      current = [];
    }
    if (gap) continue;
    current.push(`${f(azToX(a, frame))},${f(elToY(e, frame))}`);
  }
  if (current.length > 1) paths.push(`M${current.join(' L')}`);
  return paths;
}
