import * as THREE from 'three';

/*
 * Shared textures. Everything here touches the DOM, so each texture is built
 * on first call (never at import) and then reused by every scene.
 *
 * The canvas textures keep the default colour space (no sRGB decode), which
 * is how the original design was tuned.
 */

function radialCanvasTexture(
  size: number,
  stops: ReadonlyArray<readonly [number, string]>,
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  if (g) {
    const half = size / 2;
    const r = g.createRadialGradient(half, half, 0, half, half, half);
    for (const [at, color] of stops) r.addColorStop(at, color);
    g.fillStyle = r;
    g.fillRect(0, 0, size, size);
  }
  return new THREE.CanvasTexture(c);
}

let halo: THREE.CanvasTexture | null = null;
let glow: THREE.CanvasTexture | null = null;
let sunCore: THREE.CanvasTexture | null = null;

/** Thin white ring, tinted by the sprite colour, for atmosphere halos. */
export function haloTexture(): THREE.CanvasTexture {
  halo ??= radialCanvasTexture(128, [
    [0, 'rgba(255,255,255,0)'],
    [0.36, 'rgba(255,255,255,.55)'],
    [0.42, 'rgba(255,255,255,.35)'],
    [0.62, 'rgba(255,255,255,.08)'],
    [1, 'rgba(255,255,255,0)'],
  ]);
  return halo;
}

/** Warm soft glow for the Sun. */
export function glowTexture(): THREE.CanvasTexture {
  glow ??= radialCanvasTexture(256, [
    [0, 'rgba(255,240,200,1)'],
    [0.18, 'rgba(255,190,90,.75)'],
    [0.45, 'rgba(240,120,30,.22)'],
    [1, 'rgba(0,0,0,0)'],
  ]);
  return glow;
}

/** Hard bright disc for the Sun itself. */
export function sunCoreTexture(): THREE.CanvasTexture {
  sunCore ??= radialCanvasTexture(64, [
    [0, '#fff'],
    [0.85, '#fffaf0'],
    [1, 'rgba(255,250,240,0)'],
  ]);
  return sunCore;
}

/*
 * Both maps come from the NASA SVS CGI Moon Kit, https://svs.gsfc.nasa.gov/4720
 * (credit: "NASA's Scientific Visualization Studio"); see docs/data/sources.md
 * and research/web-assets.md. Longitude 0 is at the image centre, which is
 * where THREE.SphereGeometry puts +x, matching latLonToVector in units.ts.
 */
export interface MoonMaps {
  /** NASA LRO LROC colour mosaic (equirectangular). */
  map: THREE.Texture;
  /** LRO LOLA elevation as 8-bit grey (equirectangular). */
  disp: THREE.Texture;
}

let moonMapsPromise: Promise<MoonMaps> | null = null;

function loadTexture(
  loader: THREE.TextureLoader,
  url: string,
): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}

/**
 * Loads the global Moon colour and elevation maps once. Browser only.
 * A failed load clears the cache so a later call can retry.
 */
export function moonMaps(): Promise<MoonMaps> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('moonMaps() needs a browser'));
  }
  if (moonMapsPromise) return moonMapsPromise;
  const loader = new THREE.TextureLoader();
  moonMapsPromise = Promise.all([
    loadTexture(loader, '/textures/lroc_color_2k.jpg'),
    loadTexture(loader, '/textures/ldem_3_8bit.jpg'),
  ]).then(
    ([map, disp]) => {
      map.colorSpace = THREE.SRGBColorSpace;
      map.wrapS = THREE.RepeatWrapping;
      // three.js clamps this to the GPU maximum when it uploads the texture.
      map.anisotropy = 8;
      map.needsUpdate = true;
      // Elevation is data, not colour: leave it without a colour space.
      disp.wrapS = THREE.RepeatWrapping;
      disp.needsUpdate = true;
      return { map, disp };
    },
    (error: unknown) => {
      moonMapsPromise = null;
      throw error;
    },
  );
  return moonMapsPromise;
}
