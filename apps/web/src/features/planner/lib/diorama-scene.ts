import * as THREE from 'three';

import { createEarthMaterial } from '@/scene/body-material';
import { groundMaterial, slabGround } from '@/scene/ground';
import { loadLander } from '@/scene/models';
import {
  createRenderer,
  disposeObject,
  observeVisibility,
  shadowMapSize,
} from '@/scene/renderer';
import { setSpriteText, textSprite } from '@/scene/text-sprite';
import { glowTexture } from '@/scene/textures';
import { enuToVector } from '@/scene/units';

/*
 * The planner's "See the spot in 3D" diorama: a cut-out slab of decorative
 * ground around the place, the NASA lander, a compass ring, and beams toward
 * the Sun and the Earth. The directions and the visible flags come from the
 * API's /sky answer; the ground is decoration only. Browser only.
 *
 * Light intensities are the prototype's values times Math.PI, because
 * three.js lights are physically based since r155 (see scene/renderer.ts).
 */

const SUN_COLOR = '#FFC36B';
const EARTH_COLOR = '#5ED3C7';
/** Vertical exaggeration of the slab, as in the prototype. */
const EX = 2;
const SUN_ON = 3.4 * Math.PI;
const SUN_OFF = 0.15 * Math.PI;
/** After this long without input the view starts turning slowly by itself. */
const IDLE_MS = 4000;

export interface BodyDirection {
  az: number;
  el: number;
  visible: boolean;
}

export interface DioramaSky {
  sun: BodyDirection;
  earth: BodyDirection;
}

export interface DioramaScene {
  /** Rebuilds the ground for a new place. */
  setSite(lat: number, lon: number): void;
  /** Points the beams, the Sun light and the Earth; null hides them while loading. */
  setSky(sky: DioramaSky | null): void;
  setReducedMotion(on: boolean): void;
  dispose(): void;
}

export function createDioramaScene(
  canvas: HTMLCanvasElement,
  { reducedMotion }: { reducedMotion: boolean },
): DioramaScene {
  let reduced = reducedMotion;
  let disposed = false;

  const renderer = createRenderer({ canvas, alpha: false });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setClearColor(0x070b14);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x070b14, 60, 120);
  const cam = new THREE.PerspectiveCamera(38, 1, 0.05, 400);
  scene.add(new THREE.HemisphereLight(0x9cc2ff, 0x0b1222, 0.22 * Math.PI));

  const sun = new THREE.DirectionalLight(0xfff4e4, SUN_ON);
  sun.castShadow = true;
  sun.shadow.mapSize.set(shadowMapSize(), shadowMapSize());
  Object.assign(sun.shadow.camera, {
    left: -17,
    right: 17,
    top: 17,
    bottom: -17,
    near: 1,
    far: 160,
  });
  sun.shadow.bias = -0.0004;
  sun.position.set(0, 20, -80);
  scene.add(sun, sun.target);

  const grid = new THREE.GridHelper(80, 40, 0x14203a, 0x0c1424);
  const gridMats: THREE.Material[] = Array.isArray(grid.material)
    ? grid.material
    : [grid.material];
  for (const m of gridMats) {
    m.transparent = true;
    m.opacity = 0.45;
  }
  grid.position.y = -2.45;
  scene.add(grid);

  // Compass ring with cardinal labels.
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(13.1, 13.22, 160),
    new THREE.MeshBasicMaterial({
      color: 0x4a7fd4,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -2.4;
  scene.add(ring);
  for (const [t, az] of [
    ['N', 0],
    ['E', 90],
    ['S', 180],
    ['W', 270],
  ] as const) {
    const s = textSprite(t, '#9CC2FF');
    s.scale.set(2.4, 0.6, 1);
    s.position.copy(enuToVector(az, 0).multiplyScalar(14.6));
    s.position.y = -2.1;
    scene.add(s);
  }

  // Light beams toward the Sun and the Earth.
  const beam = (color: string, opacity: number) => {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1, 12, 1, true),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(m);
    return m;
  };
  const sunBeam = beam(SUN_COLOR, 0.9);
  const earthBeam = beam(EARTH_COLOR, 0.85);
  const sunGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture(),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    }),
  );
  sunGlow.scale.setScalar(2.6);
  scene.add(sunGlow);
  const earthMat = createEarthMaterial();
  const earthBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 48, 24),
    earthMat,
  );
  scene.add(earthBall);
  const sunLbl = textSprite('SUN', SUN_COLOR);
  const earthLbl = textSprite('EARTH', EARTH_COLOR);
  scene.add(sunLbl, earthLbl);
  const skyParts: THREE.Object3D[] = [
    sunBeam,
    earthBeam,
    sunGlow,
    earthBall,
    sunLbl,
    earthLbl,
  ];
  for (const o of skyParts) o.visible = false;

  const site = new THREE.Group();
  scene.add(site);
  let lander: THREE.Object3D | null = null;
  loadLander().then(
    (m) => {
      if (disposed) return;
      m.scale.setScalar(0.17);
      lander = m;
      site.add(m);
    },
    () => {
      // The view still works without the model.
    },
  );

  const ground = groundMaterial(1.4);
  let slab: THREE.Mesh | null = null;

  // Camera orbit, eased toward the target values.
  const view = {
    yaw: -0.7,
    pitch: 0.5,
    dist: 34,
    tYaw: -0.7,
    tPitch: 0.5,
    tDist: 34,
    idleT: 0,
  };

  let drag: { x: number; y: number; yaw: number; pitch: number } | null = null;
  const onDown = (e: PointerEvent) => {
    drag = { x: e.clientX, y: e.clientY, yaw: view.tYaw, pitch: view.tPitch };
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  };
  const onMove = (e: PointerEvent) => {
    if (!drag) return;
    view.tYaw = drag.yaw - (e.clientX - drag.x) * 0.008;
    view.tPitch = Math.max(
      0.12,
      Math.min(1.35, drag.pitch + (e.clientY - drag.y) * 0.006),
    );
    view.idleT = performance.now();
  };
  const onUp = () => {
    drag = null;
    canvas.style.cursor = '';
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    view.tDist = Math.max(
      14,
      Math.min(60, view.tDist * (1 + Math.sign(e.deltaY) * 0.1)),
    );
    view.idleT = performance.now();
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  const size = new THREE.Vector2();
  function render() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.getSize(size);
    if (size.x !== w || size.y !== h) {
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }
    cam.position.set(
      Math.sin(view.yaw) * Math.cos(view.pitch) * view.dist,
      Math.sin(view.pitch) * view.dist,
      Math.cos(view.yaw) * Math.cos(view.pitch) * view.dist,
    );
    cam.lookAt(0, 0.5, 0);
    renderer.render(scene, cam);
  }

  let raf = 0;
  let onScreen = false;
  function loop(now: number) {
    raf = 0;
    if (!onScreen || disposed) return;
    if (!reduced && now - view.idleT > IDLE_MS) view.tYaw += 0.0015;
    const k = reduced ? 1 : 0.12;
    view.yaw += (view.tYaw - view.yaw) * k;
    view.pitch += (view.tPitch - view.pitch) * k;
    view.dist += (view.tDist - view.dist) * k;
    earthMat.uniforms.uTime.value = now / 1000;
    render();
    raf = requestAnimationFrame(loop);
  }
  const stopObserving = observeVisibility(canvas, (v) => {
    onScreen = v;
    if (v && !raf) raf = requestAnimationFrame(loop);
  });

  const up = new THREE.Vector3(0, 1, 0);
  function place(
    mesh: THREE.Mesh,
    base: THREE.Vector3,
    dir: THREE.Vector3,
    len: number,
  ) {
    mesh.position.copy(base).addScaledVector(dir, len / 2);
    mesh.quaternion.setFromUnitVectors(up, dir);
    mesh.scale.set(1, len, 1);
  }
  const beamOpacity = (m: THREE.Mesh, o: number) => {
    if (m.material instanceof THREE.MeshBasicMaterial) m.material.opacity = o;
  };

  return {
    setSite(lat, lon) {
      if (slab) {
        scene.remove(slab);
        slab.geometry.dispose();
      }
      slab = new THREE.Mesh(slabGround(lat, lon, { ex: EX }), ground);
      slab.receiveShadow = true;
      slab.castShadow = true;
      scene.add(slab);
    },

    setSky(sky) {
      for (const o of skyParts) o.visible = sky !== null;
      if (!sky) {
        sun.intensity = SUN_ON;
        return;
      }
      const sv = enuToVector(sky.sun.az, sky.sun.el);
      const ev = enuToVector(sky.earth.az, sky.earth.el);
      const base = site.position.clone().add(new THREE.Vector3(0, 0.6, 0));
      // Keep the light just above the ground plane so the slab is still lit from the right side.
      sun.position
        .copy(site.position)
        .addScaledVector(sv.clone().setY(Math.max(sv.y, 0.02)).normalize(), 80);
      sun.target.position.copy(site.position);
      sun.intensity = sky.sun.visible ? SUN_ON : SUN_OFF;
      place(sunBeam, base, sv, 15);
      place(earthBeam, base, ev, 13);
      beamOpacity(sunBeam, sky.sun.visible ? 0.9 : 0.3);
      beamOpacity(earthBeam, sky.earth.visible ? 0.85 : 0.3);
      sunGlow.position.copy(base).addScaledVector(sv, 15.5);
      earthBall.position.copy(base).addScaledVector(ev, 13.8);
      earthMat.uniforms.uSun.value
        .copy(earthBall.position)
        .addScaledVector(sv, 1e5);
      sunLbl.position.copy(sunGlow.position).add(new THREE.Vector3(0, 1.6, 0));
      earthLbl.position
        .copy(earthBall.position)
        .add(new THREE.Vector3(0, 1.6, 0));
      setSpriteText(
        sunLbl,
        sky.sun.visible ? 'SUN' : 'SUN (HIDDEN)',
        SUN_COLOR,
      );
      setSpriteText(
        earthLbl,
        sky.earth.visible ? 'EARTH' : 'EARTH (HIDDEN)',
        EARTH_COLOR,
      );
    },

    setReducedMotion(on) {
      reduced = on;
    },

    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      stopObserving();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('wheel', onWheel);
      // The lander clone shares geometry and materials with the cached model; leave them alone.
      if (lander) site.remove(lander);
      disposeObject(scene);
      sun.dispose();
      renderer.dispose();
    },
  };
}
