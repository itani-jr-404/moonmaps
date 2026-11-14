import gsap from 'gsap';
import * as THREE from 'three';

import type { SkyResponse } from '@/lib/api/client';
import { createEarthMaterial, type BodyMaterial } from '@/scene/body-material';
import { groundMaterial, polarGround, type PolarGround } from '@/scene/ground';
import { loadLander } from '@/scene/models';
import { disposeObject } from '@/scene/renderer';
import { glowTexture, sunCoreTexture } from '@/scene/textures';
import { textSprite } from '@/scene/text-sprite';
import { D2R, enuToVector } from '@/scene/units';

/*
 * Standing on the Moon at the chosen point. Units are kilometres; the scene
 * frame is x = east, y = up, z = -north (see scene/units.ts).
 *
 * The Sun and the Earth are placed from the API's azimuth and elevation, and
 * the good/bad mood comes from the API's `visible` flags. The ground itself is
 * decorative (scene/ground.ts); the real horizon is what the API used.
 *
 * Light intensities are the prototype's times Math.PI (physically based lights).
 */

/** Distance at which the Sun and the Earth are drawn, km. */
const SKY_D = 320;
/*
 * Angular radii seen from the Moon, degrees: the Sun about 0.27 (0.53° across),
 * the Earth about 0.95 (1.9° across). Values from the prototype; the table in
 * docs/science/conventions-and-ephemeris.md still marks their source "to confirm".
 * They only size the drawing; the API decides visibility by disc centre (ADR-005).
 */
const SUN_RADIUS_DEG = 0.2666;
const EARTH_RADIUS_DEG = 0.95;
/** Earth is drawn a little larger on a good site so it reads at a glance. */
const EARTH_RADIUS_GOOD_DEG = 1.6;
/** Eye height above the ground, km (an astronaut's eyes, about 3 m up). */
const EYE = 0.0032;
const PI = Math.PI;

type Duration = (seconds: number) => number;

export class SurfaceScene {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(50, 1, 0.0006, 700);
  readonly look = { yaw: 0, pitch: -0.04 };

  private readonly ambient = new THREE.AmbientLight(0x8fa3c8, 0.012 * PI);
  private readonly sunLight = new THREE.DirectionalLight(0xfff6ea, 4.4 * PI);
  private readonly earthLight = new THREE.DirectionalLight(0x9fc4ff, 0);
  private readonly sunCore: THREE.Sprite;
  private readonly sunGlow: THREE.Sprite;
  private readonly earth: THREE.Mesh;
  private readonly earthMaterial: BodyMaterial;
  private readonly sunTag: THREE.Sprite;
  private readonly earthTag: THREE.Sprite;
  private readonly eye = new THREE.Vector3();
  private readonly dir = new THREE.Vector3();
  private readonly target = new THREE.Vector3();
  private terrain: THREE.Mesh | null = null;
  private ground: PolarGround | null = null;
  private lander: THREE.Object3D | null = null;
  private exposure = 1.05;
  private disposed = false;

  constructor() {
    this.scene.background = new THREE.Color(0x000000);
    const s = this.sunLight;
    s.castShadow = true;
    s.shadow.mapSize.set(4096, 4096);
    Object.assign(s.shadow.camera, {
      left: -0.22,
      right: 0.22,
      top: 0.22,
      bottom: -0.22,
      near: 0.05,
      far: 6,
    });
    s.shadow.camera.updateProjectionMatrix();
    s.shadow.bias = -0.00004;
    this.earthLight.target = s.target;
    this.scene.add(this.ambient, s, s.target, this.earthLight);

    // Decorative star field on a 500 km shell, kept above the ground.
    const stars: THREE.Vector3[] = [];
    for (let i = 0; i < 3000; i++) {
      const u = Math.random() * 2 - 1;
      const t = Math.random() * 2 * PI;
      const q = Math.sqrt(1 - u * u);
      stars.push(
        new THREE.Vector3(
          q * Math.cos(t) * 500,
          Math.abs(u) * 500 - 20,
          q * Math.sin(t) * 500,
        ),
      );
    }
    this.scene.add(
      new THREE.Points(
        new THREE.BufferGeometry().setFromPoints(stars),
        new THREE.PointsMaterial({
          color: 0xdfe8ff,
          size: 1.3,
          sizeAttenuation: false,
          transparent: true,
          opacity: 0.85,
        }),
      ),
    );

    // The Sun at its true angular size, with glare around it.
    this.sunCore = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: sunCoreTexture(),
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    this.sunCore.scale.setScalar(
      2 * SKY_D * Math.tan(SUN_RADIUS_DEG * D2R) * 1.15,
    );
    this.sunGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture(),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.9,
      }),
    );
    this.sunGlow.scale.setScalar(this.sunCore.scale.x * 16);
    this.scene.add(this.sunCore, this.sunGlow);

    this.earthMaterial = createEarthMaterial();
    this.earth = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 32),
      this.earthMaterial,
    );
    this.earth.scale.setScalar(SKY_D * Math.tan(EARTH_RADIUS_DEG * D2R));
    this.scene.add(this.earth);

    this.sunTag = textSprite('SUN', '#FFC36B');
    this.earthTag = textSprite('EARTH', '#5ED3C7');
    for (const tag of [this.sunTag, this.earthTag]) {
      tag.scale.set(64, 16, 1);
      tag.visible = false;
      this.scene.add(tag);
    }

    loadLander().then(
      (m) => {
        if (this.disposed) return;
        m.scale.setScalar(0.001); // the model is in metres
        m.visible = false;
        this.lander = m;
        this.scene.add(m);
        this.placeLander(this.look.yaw / D2R);
      },
      () => {
        // The view works without the lander.
      },
    );
  }

  setSize(w: number, h: number): void {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** Builds the ground around a point. Heavy (tens of thousands of vertices): call once per landing. */
  build(lat: number, lon: number): void {
    this.clearGround();
    this.ground = polarGround(lat, lon, { terrainOn: true });
    this.terrain = new THREE.Mesh(this.ground.geometry, groundMaterial(1.15));
    this.terrain.receiveShadow = true;
    this.terrain.castShadow = true;
    this.scene.add(this.terrain);
    this.eye.set(0, this.ground.heightAt(0, 0) + EYE, 0);
    if (this.lander) this.lander.visible = false;
  }

  /** Places the Sun, the Earth and the lights from an API answer, and sets the mood. */
  setSky(sky: SkyResponse): void {
    const sv = enuToVector(sky.sun.az, sky.sun.el);
    const ev = enuToVector(sky.earth.az, sky.earth.el);
    const sunUp = sky.sun.visible;
    const earthUp = sky.earth.visible;
    const good = sunUp && earthUp;

    this.sunCore.position.copy(this.eye).addScaledVector(sv, SKY_D);
    this.sunGlow.position.copy(this.sunCore.position);
    // Draw the disc while any of it can still show above the flat horizon.
    this.sunCore.visible = this.sunGlow.visible = sky.sun.el > -0.6;

    const s = this.sunLight;
    s.target.position.copy(this.eye).setY(this.eye.y - EYE);
    const lightDir = sv.clone().setY(Math.max(sv.y, 0.004)).normalize();
    s.position.copy(s.target.position).addScaledVector(lightDir, 3);

    this.earth.position.copy(this.eye).addScaledVector(ev, SKY_D);
    this.earthMaterial.uniforms.uSun.value
      .copy(this.earth.position)
      .addScaledVector(sv, 1e6);
    this.earthMaterial.uniforms.uReveal.value = 1;
    this.earthMaterial.uniforms.uAlpha.value = 1;

    // Earthshine is real and noticeable when the Sun is down and the Earth is up.
    this.earthLight.position.copy(this.eye).addScaledVector(ev, 10);
    this.earthLight.intensity = earthUp ? (sunUp ? 0.03 : 0.35) * PI : 0;

    // Good landing: bright, Sun and Earth both shown and labelled. Bad: the scene stays dark.
    this.exposure = good ? 1.3 : 0.4;
    s.intensity = (good ? 5 : sunUp ? 1.2 : 0) * PI;
    this.ambient.intensity = (good ? 0.09 : 0.006) * PI;
    this.earthMaterial.depthTest = !good;
    this.earth.renderOrder = good ? 5 : 0;
    this.sunTag.visible = this.earthTag.visible = good;
    this.sunTag.position
      .copy(this.sunCore.position)
      .add(new THREE.Vector3(0, 26, 0));
    this.earthTag.position
      .copy(this.earth.position)
      .add(new THREE.Vector3(0, 28, 0));
    this.earth.scale.setScalar(
      SKY_D * Math.tan((good ? EARTH_RADIUS_GOOD_DEG : EARTH_RADIUS_DEG) * D2R),
    );
  }

  /**
   * Turns toward the Sun, or toward the Earth when the Sun is well below the
   * horizontal, and on a good site widens the lens to hold both. Returns the
   * pitch the view should settle on.
   */
  frame(sky: SkyResponse): number {
    this.setSky(sky);
    this.look.yaw = (sky.sun.el > -0.5 ? sky.sun.az : sky.earth.az) * D2R;
    this.placeLander(this.look.yaw / D2R);
    return this.frameBoth(sky) ?? -0.035;
  }

  /**
   * The descent after the flash: from about 250 m up and behind, settling at
   * eye height. `sky` is null while the first API answer is still on its way.
   */
  arrive(sky: SkyResponse | null, d: Duration): void {
    let pitchTo = -0.035;
    if (sky) {
      pitchTo = this.frame(sky);
    } else {
      this.look.yaw = 0;
      this.placeLander(0);
    }
    this.look.pitch = -0.5;
    const back = new THREE.Vector3(
      -Math.sin(this.look.yaw),
      0,
      Math.cos(this.look.yaw),
    );
    this.camera.position
      .copy(this.eye)
      .addScaledVector(back, 0.25)
      .add(new THREE.Vector3(0, 0.25, 0));
    gsap.killTweensOf([this.camera.position, this.look]);
    gsap.to(this.camera.position, {
      x: this.eye.x,
      y: this.eye.y,
      z: this.eye.z,
      duration: d(2.6),
      ease: 'expo.out',
    });
    gsap.to(this.look, { pitch: pitchTo, duration: d(2.6), ease: 'expo.out' });
  }

  /** Turns the view by a drag, in pixels. */
  lookBy(dx: number, dy: number): void {
    this.look.yaw += dx * 0.004;
    this.look.pitch = Math.max(
      -0.35,
      Math.min(0.6, this.look.pitch + dy * 0.003),
    );
  }

  /** Compass direction of the view, degrees clockwise from north. */
  facingDeg(): number {
    return (((this.look.yaw / D2R) % 360) + 360) % 360;
  }

  /** Back to the default lens after leaving the surface. */
  resetView(): void {
    gsap.killTweensOf([this.camera.position, this.look]);
    this.camera.fov = 50;
    this.camera.updateProjectionMatrix();
  }

  render(renderer: THREE.WebGLRenderer, dt: number, timeS: number): void {
    const { yaw, pitch } = this.look;
    this.dir.set(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      -Math.cos(yaw) * Math.cos(pitch),
    );
    this.camera.lookAt(this.target.copy(this.camera.position).add(this.dir));
    this.earth.rotation.y += dt * 0.02;
    this.earthMaterial.uniforms.uTime.value = timeS;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = this.exposure;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.disposed = true;
    gsap.killTweensOf([this.camera.position, this.look]);
    this.clearGround();
    disposeObject(this.scene);
    this.scene.clear();
  }

  /** Widens the lens to hold the Sun and the Earth on a good site; returns the pitch to settle on. */
  private frameBoth(sky: SkyResponse): number | null {
    if (!(sky.sun.visible && sky.earth.visible)) return null;
    const sa = sky.sun.az;
    const d = ((sky.earth.az - sa + 540) % 360) - 180;
    this.look.yaw = (sa + d / 2) * D2R;
    this.camera.fov = Math.max(50, Math.min(110, Math.abs(d) * 1.25 + 24));
    this.camera.updateProjectionMatrix();
    return Math.max(-0.035, ((sky.sun.el + sky.earth.el) / 2) * D2R - 0.06);
  }

  /** The lander stands about 34 m from the viewer, a little to the side of the view. */
  private placeLander(azDeg: number): void {
    if (!this.lander || !this.ground) return;
    const a = (azDeg + 32) * D2R;
    const dist = 0.034;
    const east = Math.sin(a) * dist;
    const north = Math.cos(a) * dist;
    this.lander.position.set(
      east,
      this.ground.heightAt(east, north) - 0.0002,
      -north,
    );
    this.lander.rotation.y = -a + 0.6;
    this.lander.visible = true;
  }

  private clearGround(): void {
    if (!this.terrain) return;
    this.scene.remove(this.terrain);
    this.terrain.geometry.dispose();
    (this.terrain.material as THREE.Material).dispose();
    this.terrain = null;
    this.ground = null;
  }
}
