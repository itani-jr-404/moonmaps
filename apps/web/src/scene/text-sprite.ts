import * as THREE from 'three';

/*
 * Pill-shaped text labels drawn on a canvas and shown as sprites that always
 * face the camera and draw on top of the scene. Browser only.
 */

const W = 512;
const H = 128;
const lastText = new WeakMap<THREE.Sprite, string>();

function drawLabel(
  g: CanvasRenderingContext2D,
  text: string,
  color: string,
  fontPx: number,
): void {
  g.clearRect(0, 0, W, H);
  g.fillStyle = 'rgba(7,11,20,.72)';
  g.beginPath();
  if (typeof g.roundRect === 'function') g.roundRect(6, 22, 500, 84, 42);
  else g.rect(6, 22, 500, 84);
  g.fill();
  g.font = `600 ${fontPx}px ${bodyFontFamily()}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = color;
  g.fillText(text, 256, 66);
}

/** New label sprite, 4 x 1 scene units, drawn above everything else. */
export function textSprite(text: string, color = '#E8EEF8'): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  if (g) drawLabel(g, text, color, 52);
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(c),
      transparent: true,
      depthTest: false,
    }),
  );
  s.scale.set(4, 1, 1);
  s.renderOrder = 10;
  lastText.set(s, `${color}|${text}`);
  return s;
}

/**
 * Redraws a label made by textSprite. Cheap to call every frame: it only
 * redraws when the text or colour changes.
 */
export function setSpriteText(
  sprite: THREE.Sprite,
  text: string,
  color: string,
): void {
  const key = `${color}|${text}`;
  if (lastText.get(sprite) === key) return;
  const map = sprite.material.map;
  const image: unknown = map?.image;
  if (!map || !(image instanceof HTMLCanvasElement)) return;
  const g = image.getContext('2d');
  if (!g) return;
  lastText.set(sprite, key);
  drawLabel(g, text, color, 46);
  map.needsUpdate = true;
}

/** next/font gives Jost a generated family name; read it from the CSS variable the layout sets. */
function bodyFontFamily(): string {
  const fromCss = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-jost')
    .trim();
  return fromCss ? `${fromCss}, sans-serif` : 'Jost, sans-serif';
}
