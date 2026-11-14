import * as THREE from 'three';

/*
 * Renderer setup and cleanup shared by every 3D view. Browser only: call
 * these from effects, never at import time.
 *
 * Lighting note for scenes: three.js lights are physically based since r155,
 * so a light intensity from the original design must be multiplied by Math.PI
 * to look the same.
 */

export interface CreateRendererOptions {
  canvas?: HTMLCanvasElement;
  /** Transparent background so the page shows through. */
  alpha?: boolean;
  antialias?: boolean;
  /** Upper bound on devicePixelRatio, to cap GPU cost on dense screens. */
  maxPixelRatio?: number;
}

export function createRenderer({
  canvas,
  alpha = true,
  antialias = true,
  maxPixelRatio = 2,
}: CreateRendererOptions = {}): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha,
    antialias,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
  if (alpha) renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}

function disposeMaterial(material: THREE.Material): void {
  const fields = material as unknown as Record<string, unknown>;
  for (const key of Object.keys(fields)) {
    const value = fields[key];
    if (value instanceof THREE.Texture) value.dispose();
  }
  if (material instanceof THREE.ShaderMaterial) {
    for (const uniform of Object.values(material.uniforms)) {
      const value: unknown = uniform.value;
      if (value instanceof THREE.Texture) value.dispose();
    }
  }
  material.dispose();
}

/**
 * Frees the GPU memory of every geometry, material and texture under `root`.
 * Shared resources (cached textures, model clones) are re-uploaded by three.js
 * if another scene still uses them, so this is safe to call on unmount.
 */
export function disposeObject(root: THREE.Object3D): void {
  root.traverse((o) => {
    if (
      o instanceof THREE.Mesh ||
      o instanceof THREE.Points ||
      o instanceof THREE.Line
    ) {
      o.geometry.dispose();
    }
    if (
      o instanceof THREE.Mesh ||
      o instanceof THREE.Points ||
      o instanceof THREE.Line ||
      o instanceof THREE.Sprite
    ) {
      const material: THREE.Material | THREE.Material[] = o.material;
      if (Array.isArray(material)) material.forEach(disposeMaterial);
      else disposeMaterial(material);
    }
  });
}

/**
 * Calls `cb(true)` when `el` scrolls into view and `cb(false)` when it leaves,
 * so a view can pause its render loop off screen. Returns a cleanup function.
 */
export function observeVisibility(
  el: Element,
  cb: (visible: boolean) => void,
): () => void {
  if (typeof IntersectionObserver === 'undefined') {
    cb(true);
    return () => {};
  }
  const io = new IntersectionObserver((entries) => {
    const last = entries[entries.length - 1];
    if (last) cb(last.isIntersecting);
  });
  io.observe(el);
  return () => io.disconnect();
}
