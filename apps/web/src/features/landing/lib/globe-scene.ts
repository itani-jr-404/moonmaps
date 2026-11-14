import gsap from 'gsap';
import * as THREE from 'three';

import { createMoonMaterial, type BodyMaterial } from '@/scene/body-material';
import { disposeObject } from '@/scene/renderer';
import { haloTexture } from '@/scene/textures';
import { latLonToVector, vectorToLatLon } from '@/scene/units';

/*
 * The orbit view of "Choose your landing": the whole Moon, a graticule, the
 * -80° ring, curated site pins and the red landing arrow. It is a picture:
 * the light comes from a fixed direction, not from the real Sun.
 *
 * Colours are set without sRGB decoding and the output is linear, which is how
 * the prototype was tuned (three r128, no colour management). Light
 * intensities are the prototype's times Math.PI (physically based lights).
 */

export const CAM_Z = 4.6;
/** Camera distance at the end of the dive, just before the flash. */
export const CAM_NEAR_Z = 1.12;
export const HALO_OPACITY = 0.32;

const ACCENT_2 = 0x9cc2ff;

export interface GlobeHit {
  lat: number;
  lon: number;
  /** Unit vector of the hit point in the Moon's own frame. */
  local: THREE.Vector3;
  /** Pointer position inside the canvas, px. */
  x: number;
  y: number;
  w: number;
  h: number;
}

function rawColor(hex: number): THREE.Color {
  return new THREE.Color().setHex(hex, THREE.LinearSRGBColorSpace);
}

function latitudeRing(lat: number, n: number, r: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    pts.push(
      latLonToVector(lat, (i / n) * 360, r),
      latLonToVector(lat, ((i + 1) / n) * 360, r),
    );
  }
  return pts;
}

export class GlobeScene {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(28, 1, 0.01, 100);
  readonly haloMaterial: THREE.SpriteMaterial;

  private readonly material: BodyMaterial;
  private readonly moon: THREE.Mesh;
  private readonly pins = new THREE.Group();
  private readonly pinGeometry = new THREE.SphereGeometry(0.011, 12, 8);
  private readonly pinMaterial = new THREE.MeshBasicMaterial({
    color: rawColor(ACCENT_2),
  });
  private readonly arrow = new THREE.Group();
  private readonly ring: THREE.Mesh;
  private readonly ringMaterial: THREE.MeshBasicMaterial;
  private readonly aim: { n: THREE.Vector3 | null; drop: number } = {
    n: null,
    drop: 0,
  };
  private readonly angVel = new THREE.Vector2();
  private readonly ray = new THREE.Raycaster();
  private readonly ndc = new THREE.Vector2();
  private readonly qTmp = new THREE.Quaternion();
  private readonly axisX = new THREE.Vector3(0, 1, 0);
  private readonly axisY = new THREE.Vector3(1, 0, 0);
  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly zAxis = new THREE.Vector3(0, 0, 1);

  constructor(private readonly reducedMotion: boolean) {
    this.camera.position.set(0, 0, CAM_Z);
    this.camera.lookAt(0, 0, 0);

    this.material = createMoonMaterial();
    this.material.uniforms.uSun.value.set(6, 2.5, 5);
    this.moon = new THREE.Mesh(
      new THREE.SphereGeometry(1, 192, 96),
      this.material,
    );
    // Start with the south pole turned toward the viewer.
    this.moon.quaternion.setFromEuler(new THREE.Euler(-1.1, -0.6, 0.08, 'XYZ'));
    this.scene.add(this.moon);

    this.haloMaterial = new THREE.SpriteMaterial({
      map: haloTexture(),
      color: rawColor(0xbcd4ff),
      transparent: true,
      opacity: HALO_OPACITY,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halo = new THREE.Sprite(this.haloMaterial);
    halo.scale.setScalar(2.95);
    this.scene.add(halo);

    // Graticule: parallels every 30°, meridians every 30°.
    const grid: THREE.Vector3[] = [];
    for (const lat of [-60, -30, 0, 30, 60]) {
      grid.push(...latitudeRing(lat, 160, 1.002));
    }
    for (let lon = 0; lon < 360; lon += 30) {
      for (let la = -88; la < 88; la += 4) {
        grid.push(
          latLonToVector(la, lon, 1.002),
          latLonToVector(la + 4, lon, 1.002),
        );
      }
    }
    this.moon.add(
      new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(grid),
        new THREE.LineBasicMaterial({
          color: rawColor(ACCENT_2),
          transparent: true,
          opacity: 0.08,
        }),
      ),
    );
    // The -80° ring marks the south polar region the challenge is about.
    this.moon.add(
      new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(latitudeRing(-80, 200, 1.003)),
        new THREE.LineBasicMaterial({
          color: rawColor(ACCENT_2),
          transparent: true,
          opacity: 0.7,
        }),
      ),
    );
    this.moon.add(this.pins);

    // The red landing arrow and the pulsing ring on the ground.
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.45 * Math.PI));
    const light = new THREE.DirectionalLight(0xffffff, 1.1 * Math.PI);
    light.position.set(3, 4, 5);
    this.scene.add(light);
    const red = new THREE.MeshStandardMaterial({
      color: rawColor(0xff2b2b),
      emissive: rawColor(0x7a0000),
      roughness: 0.35,
      metalness: 0.2,
    });
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 32), red);
    head.rotation.x = Math.PI;
    head.position.y = 0.05;
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.16, 20),
      red,
    );
    shaft.position.y = 0.18;
    this.arrow.add(head, shaft);
    this.arrow.visible = false;
    this.scene.add(this.arrow);
    this.ringMaterial = new THREE.MeshBasicMaterial({
      color: rawColor(0xff3b3b),
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.035, 0.05, 48),
      this.ringMaterial,
    );
    this.ring.visible = false;
    this.scene.add(this.ring);
  }

  /** Puts a small pin on every curated site. */
  setSites(sites: readonly { lat: number; lon: number }[]): void {
    this.pins.clear();
    for (const s of sites) {
      const pin = new THREE.Mesh(this.pinGeometry, this.pinMaterial);
      pin.position.copy(latLonToVector(s.lat, s.lon, 1.004));
      this.pins.add(pin);
    }
  }

  setSize(w: number, h: number): void {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** The point on the Moon under the pointer, or null when the pointer is off the globe. */
  hit(clientX: number, clientY: number, rect: DOMRect): GlobeHit | null {
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    this.ndc.set((x / rect.width) * 2 - 1, -(y / rect.height) * 2 + 1);
    this.moon.updateMatrixWorld();
    this.ray.setFromCamera(this.ndc, this.camera);
    const h = this.ray.intersectObject(this.moon, false)[0];
    if (!h) return null;
    const local = this.moon.worldToLocal(h.point.clone()).normalize();
    const { lat, lon } = vectorToLatLon(local);
    return { lat, lon, local, x, y, w: rect.width, h: rect.height };
  }

  /** Shows the arrow over a point (Moon frame), dropping it in when it first appears. */
  setAim(local: THREE.Vector3 | null): void {
    if (!local) {
      gsap.killTweensOf(this.aim);
      this.aim.n = null;
      this.arrow.visible = this.ring.visible = false;
      return;
    }
    if (!this.aim.n) {
      if (this.reducedMotion) {
        this.aim.drop = 0;
      } else {
        this.aim.drop = 0.5;
        gsap.to(this.aim, {
          drop: 0,
          duration: 0.8,
          ease: 'bounce.out',
          overwrite: true,
        });
      }
    }
    this.aim.n = local.clone();
    this.arrow.visible = this.ring.visible = true;
  }

  /** Trackball: horizontal drag turns about the screen's vertical axis, vertical drag about its horizontal axis. */
  spinBy(dx: number, dy: number): void {
    this.qTmp.setFromAxisAngle(this.axisX, dx);
    this.moon.quaternion.premultiply(this.qTmp);
    this.qTmp.setFromAxisAngle(this.axisY, dy);
    this.moon.quaternion.premultiply(this.qTmp);
  }

  /** Drag speed handed to the inertia when the pointer lets go (radians per frame at 60 fps). */
  setVelocity(dx: number, dy: number): void {
    if (this.reducedMotion) this.angVel.set(0, 0);
    else this.angVel.set(dx, dy);
  }

  /** Returns a function that turns the Moon so `local` faces the camera, from 0 (now) to 1. */
  turnToward(local: THREE.Vector3): (t: number) => void {
    const from = local
      .clone()
      .applyQuaternion(this.moon.quaternion)
      .normalize();
    const q0 = this.moon.quaternion.clone();
    const q1 = new THREE.Quaternion()
      .setFromUnitVectors(from, this.zAxis)
      .multiply(q0);
    return (t) => {
      this.moon.quaternion.copy(q0).slerp(q1, t);
    };
  }

  /** Inertia after a drag, then a slow idle turn unless the visitor is aiming or prefers less motion. */
  updateMotion(dt: number, dragging: boolean, aiming: boolean): void {
    if (dragging) return;
    const frames = dt * 60;
    this.angVel.multiplyScalar(Math.pow(0.93, frames));
    if (this.angVel.lengthSq() > 1e-7) {
      this.spinBy(this.angVel.x * frames, this.angVel.y * frames);
    } else if (!aiming && !this.reducedMotion) {
      const axis = new THREE.Vector3(0, 1, 0).applyQuaternion(
        this.moon.quaternion,
      );
      this.qTmp.setFromAxisAngle(axis, dt * 0.05);
      this.moon.quaternion.premultiply(this.qTmp);
    }
  }

  render(renderer: THREE.WebGLRenderer, timeS: number): void {
    this.material.uniforms.uTime.value = timeS;
    this.placeArrow(timeS);
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    gsap.killTweensOf(this.aim);
    gsap.killTweensOf(this.camera.position);
    gsap.killTweensOf(this.haloMaterial);
    this.pins.clear();
    this.pinGeometry.dispose();
    this.pinMaterial.dispose();
    disposeObject(this.scene);
    this.scene.clear();
  }

  private placeArrow(t: number): void {
    if (!this.aim.n) return;
    const n = this.aim.n
      .clone()
      .applyQuaternion(this.moon.quaternion)
      .normalize();
    const bob = this.reducedMotion ? 0 : 0.012 * (1 + Math.sin(t * 4));
    this.arrow.quaternion.setFromUnitVectors(this.up, n);
    this.arrow.position.copy(n).multiplyScalar(1.004 + this.aim.drop + bob);
    this.ring.quaternion.setFromUnitVectors(this.zAxis, n);
    this.ring.position.copy(n).multiplyScalar(1.003);
    const phase = this.reducedMotion ? 0 : (t * 1.2) % 1;
    this.ring.scale.setScalar(1 + phase * 1.6);
    this.ringMaterial.opacity = 0.9 * (1 - phase);
  }
}
