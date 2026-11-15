import * as THREE from 'three';

import {
  createEarthMaterial,
  createMoonMaterial,
  type BodyUniforms,
} from '@/scene/body-material';
import { loadAstronaut } from '@/scene/models';
import { createRenderer, disposeObject } from '@/scene/renderer';
import { glowTexture, haloTexture, moonMaps } from '@/scene/textures';
import { D2R } from '@/scene/units';

/*
 * The hero stage: a fixed, full-screen three.js scene behind the hero copy.
 * The Moon (preloader subject, then a quiet background body), the Earth's
 * limb, the Sun glow, stars, drifting dust, a wireframe drawn on the Moon
 * during the preloader, and the NASA Z2 astronaut with a blue frame behind it.
 *
 * Everything here is decoration. Nothing in this scene says where the Sun or
 * the Earth really is; the live readout in the hero copy comes from the API.
 *
 * The intro and scroll code drive the scene by tweening the numbers in `P`.
 */

/** Progress values (0..1) that the intro, scroll and pointer code tween. */
export interface HeroProgress {
  /** Camera move from the close Moon shot to the hero framing. */
  intro: number;
  /** Astronaut drifts in from behind. */
  show: number;
  /** Astronaut glides from the centre to its place beside the copy. */
  astro: number;
  /** Blue frame behind the astronaut fades in. */
  frame: number;
  /** Scroll dolly while the hero leaves the screen. */
  dolly: number;
  /** Smoothed pointer position, -1..1. */
  px: number;
  py: number;
  /** 0 = three extra turns still to go, 1 = at rest. Only the intro tweens it, once. */
  spin: number;
  /** Sun glow opacity. */
  sunA: number;
}

export interface HeroScene {
  P: HeroProgress;
  moonUniforms: BodyUniforms;
  earthUniforms: BodyUniforms;
  starUniforms: { uAlpha: THREE.IUniform<number> };
  dustMaterial: THREE.PointsMaterial;
  wireframe: THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  /** Vertex count of the full wireframe, for drawing it progressively. */
  wireframeCount: number;
  /** Resolves true once the astronaut is in the scene, false if it failed to load. */
  astronaut: Promise<boolean>;
  /** Moves the Moon's light from behind it (0) to its final place (1). */
  sweepSun(a: number): void;
  /** Hides the preloader wireframe and shows every body at full strength. */
  setFinalState(): void;
  layout(): void;
  /** Compiles the shaders so the first visible frame does not stall. */
  compile(): Promise<void>;
  /** Starts drawing (a loop when animated, one frame when static). */
  start(): void;
  /** Pauses the render loop while the stage is scrolled away. */
  setVisible(visible: boolean): void;
  dispose(): void;
}

export interface HeroSceneOptions {
  /** False under reduced motion: draw still frames on demand, no loop. */
  animate: boolean;
  /** Left edge of the hero copy in CSS pixels, or null if it is not there. */
  getCopyLeft: () => number | null;
}

const FOV = 35;
const CAM_Z = 14;
const TAN_HALF = Math.tan((FOV / 2) * D2R);

/*
 * The design was tuned on three.js r128, which did no colour management:
 * hex colours went to the GPU as they were and were then sRGB-encoded on
 * output. Tagging them linear here reproduces that look in r187.
 */
function raw(c: THREE.ColorRepresentation): THREE.Color {
  const out = new THREE.Color();
  if (typeof c === 'number') return out.setHex(c, THREE.LinearSRGBColorSpace);
  if (typeof c === 'string') return out.setStyle(c, THREE.LinearSRGBColorSpace);
  return out.copy(c);
}

/** three.js lights are physically based since r155; the design's values assumed the old scale. */
const LIGHT = Math.PI;

const ease = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

export function createHeroScene(
  container: HTMLElement,
  { animate, getCopyLeft }: HeroSceneOptions,
): HeroScene {
  const renderer = createRenderer({
    maxPixelRatio: window.innerWidth < 700 ? 1.5 : 2,
  });
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(
    FOV,
    window.innerWidth / window.innerHeight,
    0.1,
    3000,
  );

  const halo = (color: string, opacity: number) =>
    new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: haloTexture(),
        color: raw(color),
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );

  // Where the light falls from: the Sun, up and to the right.
  const light = new THREE.Vector3(420, 260, 260);
  const behind = new THREE.Vector3(0, 0, -600);

  /* ---- the Moon ---- */
  const moonMat = createMoonMaterial();
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 64), moonMat);
  moon.rotation.set(-0.5, -0.4, 0);
  const moonHalo = halo('#bcd4ff', 0.3);
  moonHalo.scale.setScalar(2.9);
  moon.add(moonHalo);
  scene.add(moon);

  /* ---- the Earth's limb, the Sun glow ---- */
  const earthMat = createEarthMaterial();
  earthMat.uniforms.uSpot.value = 1;
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 64), earthMat);
  const earthHalo = halo('#6fa8ff', 0.7);
  earthHalo.scale.setScalar(2.35);
  earth.add(earthHalo);
  earth.rotation.set(0.3, 2.2, 0.2);
  scene.add(earth);
  const sunGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture(),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0,
    }),
  );
  const sunCore = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: haloTexture(),
      color: raw(0xfff1cf),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0,
    }),
  );
  scene.add(sunGlow, sunCore);

  /* ---- stars and drifting dust ---- */
  const starCount = window.innerWidth < 700 ? 1800 : 3600;
  const starPos = new Float32Array(starCount * 3);
  const starSize = new Float32Array(starCount);
  const starPhase = new Float32Array(starCount);
  for (let i = 0; i < starCount; i++) {
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const r = 900 + Math.random() * 600;
    const q = Math.sqrt(1 - u * u);
    starPos[i * 3] = r * q * Math.cos(th);
    starPos[i * 3 + 1] = r * u;
    starPos[i * 3 + 2] = r * q * Math.sin(th);
    starSize[i] = Math.pow(Math.random(), 3) * 2.4 + 0.5;
    starPhase[i] = Math.random() * 6.28;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('size', new THREE.BufferAttribute(starSize, 1));
  starGeo.setAttribute('ph', new THREE.BufferAttribute(starPhase, 1));
  const starUniforms = {
    uTime: { value: 0 },
    uAlpha: { value: 0 },
    uPR: { value: renderer.getPixelRatio() },
  };
  const starMat = new THREE.ShaderMaterial({
    uniforms: starUniforms,
    vertexShader: /* glsl */ `attribute float size; attribute float ph; uniform float uTime; uniform float uPR; varying float vA;
      void main(){ vA=.55+.45*sin(uTime*1.3+ph); gl_PointSize=size*uPR; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: /* glsl */ `uniform float uAlpha; varying float vA;
      void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,0.,d); gl_FragColor=vec4(vec3(.85,.92,1.),a*vA*uAlpha); }`,
    transparent: true,
    depthWrite: false,
  });
  scene.add(new THREE.Points(starGeo, starMat));

  const dustCount = 400;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 60;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 36;
    dustPos[i * 3 + 2] = -Math.random() * 60 + 8;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMaterial = new THREE.PointsMaterial({
    color: raw(0x9cc2ff),
    size: 0.05,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const dust = new THREE.Points(dustGeo, dustMaterial);
  scene.add(dust);

  /* ---- preloader wireframe on the Moon: parallels every 15 deg, then meridians ---- */
  const wfPts: number[] = [];
  for (let la = -75; la <= 75; la += 15) {
    const c = Math.cos(la * D2R);
    const s = Math.sin(la * D2R);
    for (let k = 0; k < 96; k++) {
      const a1 = (k / 96) * Math.PI * 2;
      const a2 = ((k + 1) / 96) * Math.PI * 2;
      wfPts.push(
        c * Math.cos(a1),
        s,
        c * Math.sin(a1),
        c * Math.cos(a2),
        s,
        c * Math.sin(a2),
      );
    }
  }
  for (let lo = 0; lo < 360; lo += 15) {
    const o = lo * D2R;
    for (let k = 0; k < 48; k++) {
      const b1 = (k / 48 - 0.5) * Math.PI;
      const b2 = ((k + 1) / 48 - 0.5) * Math.PI;
      wfPts.push(
        Math.cos(b1) * Math.cos(o),
        Math.sin(b1),
        Math.cos(b1) * Math.sin(o),
        Math.cos(b2) * Math.cos(o),
        Math.sin(b2),
        Math.cos(b2) * Math.sin(o),
      );
    }
  }
  const wfGeo = new THREE.BufferGeometry();
  wfGeo.setAttribute('position', new THREE.Float32BufferAttribute(wfPts, 3));
  const wireframeCount = wfPts.length / 3;
  const wireframe = new THREE.LineSegments(
    wfGeo,
    new THREE.LineBasicMaterial({
      color: raw(0x9cc2ff),
      transparent: true,
      opacity: 1,
    }),
  );
  wfGeo.setDrawRange(0, 0);
  wireframe.scale.setScalar(1.004);
  moon.add(wireframe);

  /* ---- lights and the astronaut ---- */
  scene.add(
    new THREE.HemisphereLight(raw(0xdce8ff), raw(0x0a1428), 0.35 * LIGHT),
  );
  const key = new THREE.DirectionalLight(raw(0xfff8f0), 2.2 * LIGHT);
  key.position.copy(light).normalize().multiplyScalar(20);
  scene.add(key);
  const rim = new THREE.DirectionalLight(raw(0x6f9ae0), 1.4 * LIGHT);
  rim.position.set(-14, 6, -12);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(raw(0x9cc2ff), 0.5 * LIGHT);
  fill.position.set(-8, -6, 10);
  scene.add(fill);

  const astroRoot = new THREE.Group();
  const astroSpin = new THREE.Group();
  astroRoot.add(astroSpin);
  scene.add(astroRoot);

  /* ---- the blue frame behind the astronaut ---- */
  const frame = new THREE.Group();
  const frameMat = new THREE.MeshBasicMaterial({
    color: raw(0x4a7fd4),
    transparent: true,
    opacity: 0,
  });
  const FW = 2.7;
  const FH = 5.6;
  const FT = 0.08;
  const bars: ReadonlyArray<readonly [number, number, number, number]> = [
    [0, FH / 2, FW + FT, FT],
    [0, -FH / 2, FW + FT, FT],
    [-FW / 2, 0, FT, FH],
    [FW / 2, 0, FT, FH],
  ];
  for (const [x, y, w, h] of bars) {
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(w, h), frameMat);
    bar.position.set(x, y, 0);
    frame.add(bar);
  }
  scene.add(frame);

  /* ---- layout ---- */
  const P: HeroProgress = {
    intro: 0,
    show: 0,
    astro: 0,
    frame: 0,
    dolly: 0,
    px: 0,
    py: 0,
    spin: 1,
    sunA: 0,
  };
  const L = {
    narrow: false,
    center: new THREE.Vector3(),
    home: new THREE.Vector3(),
    scale: 1,
    moonHome: new THREE.Vector3(),
    moonR: 1,
  };

  function layout() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = w / h;
    const narrow = aspect < 0.9;
    cam.aspect = aspect;
    cam.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    const hh = CAM_Z * TAN_HALF;
    const hw = hh * aspect;
    L.narrow = narrow;
    L.center.set(0, narrow ? hh * 0.4 : 0, 0);
    const copyLeft = narrow ? null : getCopyLeft();
    const sxText = copyLeft === null ? 0 : (copyLeft / w) * 2 - 1;
    // The frame sits 1.8 units behind the astronaut.
    const xTextAtFrame = sxText * (CAM_Z + 1.8) * TAN_HALF * aspect - 0.45;
    // Astronaut half-width + frame offset + frame half-width + drift.
    const span = 1.35 + 1.5 + 1.35 + 0.35;
    L.scale = narrow
      ? 0.36
      : Math.max(0.55, Math.min(1, (xTextAtFrame - (-hw + 0.25)) / span));
    if (narrow) L.home.set(hw * 0.15, hh * 0.64, 0);
    else
      L.home.set(
        Math.min(-hw * 0.42, xTextAtFrame - (1.5 + 1.35 + 0.35) * L.scale),
        -0.1,
        0,
      );
    // Sun, Earth and Moon together on the right: the Sun lights both bodies from its place on screen.
    const at = (z: number, nx: number, ny: number) =>
      new THREE.Vector3(
        nx * (CAM_Z - z) * TAN_HALF * aspect,
        ny * (CAM_Z - z) * TAN_HALF,
        z,
      );
    const sunPos = narrow ? at(-400, 0.92, 0.9) : at(-400, 0.98, 0.62);
    sunGlow.position.copy(sunPos);
    sunCore.position.copy(sunPos);
    const sr = (CAM_Z + 400) * TAN_HALF * (narrow ? 0.05 : 0.07);
    sunCore.scale.setScalar(sr);
    sunGlow.scale.setScalar(sr * 9);
    light.set(sunPos.x * 0.5, sunPos.y * 0.5, 240);
    key.position.set(0.85, 0.45, 0.55).normalize().multiplyScalar(20);
    const ez = -90;
    const ePos = narrow ? at(ez, 0.25, 0.86) : at(ez, 0.88, 0.02);
    const er = (CAM_Z - ez) * TAN_HALF * (narrow ? 0.05 : 0.075);
    earth.position.copy(ePos);
    earth.scale.setScalar(er);
    earthMat.uniforms.uSun.value.copy(light);
    // Moon: quiet in the lower right (desktop) or upper left (phone), behind everything.
    const mz = -26;
    const hhm = (CAM_Z - mz) * TAN_HALF;
    const hwm = hhm * aspect;
    const mr = hhm * (narrow ? 0.22 : 0.3);
    L.moonHome.set(
      narrow ? -hwm * 0.82 : hwm * 0.86,
      hhm * (narrow ? 0.5 : -0.6),
      mz,
    );
    L.moonR = mr;
    moon.scale.setScalar(mr);
    moonMat.uniforms.uSun.value.copy(light);
    requestRender();
  }

  /* ---- render loop ---- */
  const camHome = new THREE.Vector3(0, 0, CAM_Z);
  const lookHome = new THREE.Vector3(0, 0, 0);
  const camPre = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const look = new THREE.Vector3();
  const astroPos = new THREE.Vector3();
  const t0 = performance.now();
  let rafId = 0;
  let visible = true;
  let disposed = false;

  function draw(now: number) {
    const t = animate ? (now - t0) / 1000 : 0;
    moon.position.copy(L.moonHome);
    if (animate) {
      moon.rotation.y += 0.0006;
      earth.rotation.y += 0.0002;
    }
    earthHalo.material.opacity = 0.7 * earthMat.uniforms.uAlpha.value;
    sunGlow.material.opacity = P.sunA;
    sunCore.material.opacity = P.sunA * 0.9;
    moonMat.uniforms.uTime.value = t;
    earthMat.uniforms.uTime.value = t;
    starUniforms.uTime.value = t;
    dust.rotation.y = t * 0.01;
    // Camera: from the close Moon shot (preloader) to the hero framing.
    camPre.copy(moon.position);
    camPre.z += L.moonR * (L.narrow ? 11 : 6);
    camPos.copy(camPre).lerp(camHome, P.intro);
    look.copy(moon.position).lerp(lookHome, P.intro);
    camPos.z -= P.dolly * 10;
    camPos.y += P.dolly * 2;
    look.y += P.dolly * 3;
    camPos.x += P.px * 0.35 * P.intro;
    camPos.y += P.py * 0.25 * P.intro;
    cam.position.copy(camPos);
    cam.lookAt(look);
    // Astronaut: appears in the centre, then glides to its place.
    const a = ease(P.astro);
    astroPos.copy(L.center).lerp(L.home, a);
    astroPos.z = -14 * (1 - P.show);
    astroPos.y += Math.sin(t * 0.8) * 0.18 - P.dolly * 4;
    astroPos.x -= P.dolly * 3;
    astroRoot.position.copy(astroPos);
    astroRoot.scale.setScalar(L.scale * (0.55 + 0.45 * P.show));
    astroRoot.visible = P.show > 0.001;
    astroSpin.rotation.set(
      0.12 + P.py * 0.12 + Math.sin(t * 0.5) * 0.05,
      -0.55 +
        (1 - a) * 1.2 +
        (1 - P.spin) * Math.PI * 2 +
        P.px * 0.35 +
        Math.sin(t * 0.3) * 0.08,
      -0.32 + Math.sin(t * 0.4) * 0.06,
    );
    frame.position.set(
      astroPos.x + (L.narrow ? 1.4 : 1.5) * L.scale,
      astroPos.y + 0.2,
      astroPos.z - 1.8,
    );
    frame.scale.setScalar(L.scale);
    frameMat.opacity = L.narrow ? 0 : P.frame * 0.95;
    renderer.render(scene, cam);
  }

  const canDraw = () => !disposed && visible && !document.hidden;

  function loop(now: number) {
    rafId = 0;
    if (!canDraw()) return;
    draw(now);
    if (animate) rafId = requestAnimationFrame(loop);
  }

  /** Animated: (re)starts the loop. Static: draws one frame. */
  function requestRender() {
    if (!rafId && canDraw()) rafId = requestAnimationFrame(loop);
  }

  /* ---- listeners ---- */
  const onPointerMove = (e: PointerEvent) => {
    P.px += ((e.clientX / window.innerWidth - 0.5) * 2 - P.px) * 0.08;
    P.py += (-(e.clientY / window.innerHeight - 0.5) * 2 - P.py) * 0.08;
  };
  const onVisibility = () => requestRender();
  window.addEventListener('resize', layout);
  document.addEventListener('visibilitychange', onVisibility);
  // Parallax is motion the visitor did not ask for, so it is off under reduced motion.
  if (animate)
    window.addEventListener('pointermove', onPointerMove, { passive: true });

  // A static scene has no loop, so draw again when the slow assets arrive.
  moonMaps().then(
    () => requestRender(),
    () => {},
  );
  const astronaut = loadAstronaut().then(
    (model) => {
      if (disposed) return false;
      astroSpin.add(model);
      requestRender();
      return true;
    },
    () => false,
  );

  layout();

  return {
    P,
    moonUniforms: moonMat.uniforms,
    earthUniforms: earthMat.uniforms,
    starUniforms,
    dustMaterial,
    wireframe,
    wireframeCount,
    astronaut,
    sweepSun(a) {
      moonMat.uniforms.uSun.value.copy(behind).lerp(light, a);
    },
    setFinalState() {
      Object.assign(P, {
        intro: 1,
        show: 1,
        astro: 1,
        frame: 1,
        spin: 1,
        sunA: 1,
      });
      starUniforms.uAlpha.value = 1;
      dustMaterial.opacity = 0.5;
      wireframe.visible = false;
      moonMat.uniforms.uReveal.value = 1;
      moonMat.uniforms.uSun.value.copy(light);
      earthMat.uniforms.uAlpha.value = 1;
      requestRender();
    },
    layout,
    async compile() {
      await renderer.compileAsync(scene, cam);
    },
    start: requestRender,
    setVisible(v) {
      visible = v;
      requestRender();
    },
    dispose() {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      window.removeEventListener('resize', layout);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
      disposeObject(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}
