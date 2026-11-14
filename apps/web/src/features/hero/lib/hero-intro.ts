import gsap from 'gsap';

import type { HeroScene } from './hero-scene';

/*
 * The opening sequence, as in the prototype's playIntro():
 * 1. Preloader: the captions slide in and glow, a wireframe is drawn over the
 *    Moon, its surface fades in and the light sweeps round to the terminator.
 *    The timeline then waits at "ready" until loading is done or skipped.
 * 2. Exit: the panels split open, the camera pulls back to the hero framing,
 *    the stars, Earth and Sun come up, the astronaut drifts in and the copy arrives.
 */

export interface IntroElements {
  /** Both captions, left first. */
  caps: HTMLElement[];
  capL: HTMLElement;
  capR: HTMLElement;
  pct: HTMLElement;
  ring: Element;
  skip: HTMLElement;
  line: HTMLElement;
  top: HTMLElement;
  bot: HTMLElement;
  /** Heading lines that slide up from their masks. */
  lines: HTMLElement[];
  /** Hero blocks that fade up. */
  fades: HTMLElement[];
}

export interface Intro {
  /** Plays the exit. Safe to call more than once. */
  go(): void;
  /** Resolves when the preloader part has played, then plays the exit. */
  waitReady(): Promise<void>;
  kill(): void;
}

const READY_AT = 3.1;

/** Shows the hero copy in its final place at once (reduced motion, or no 3D). */
export function showCopyNow(lines: HTMLElement[], fades: HTMLElement[]) {
  gsap.set(lines, { y: 0, yPercent: 0 });
  gsap.set(fades, { opacity: 1, y: 0 });
}

export function startIntro(
  scene: HeroScene,
  el: IntroElements,
  onFinish: () => void,
): Intro {
  const P = scene.P;
  const moonU = scene.moonUniforms;
  const earthU = scene.earthUniforms;
  moonU.uReveal.value = 0;
  earthU.uAlpha.value = 0;
  // y: 0 clears the CSS placeholder transform, which GSAP would otherwise read as a pixel offset.
  gsap.set(el.lines, { y: 0, yPercent: 115 });
  gsap.set(el.fades, { opacity: 0, y: 24 });

  const wire = { n: 0 };
  const sweep = { a: 0 };
  const tl = gsap.timeline();
  // The two halves slide in from the edges, then light up as the Moon's surface appears.
  tl.to(
    el.caps,
    { opacity: 1, x: 0, duration: 1.1, ease: 'expo.out', stagger: 0.12 },
    0.2,
  )
    .to(
      el.caps,
      {
        color: '#ffffff',
        textShadow:
          '0 0 18px rgba(156,194,255,.95), 0 0 48px rgba(74,127,212,.85), 0 0 110px rgba(74,127,212,.55)',
        duration: 1.2,
        ease: 'power2.out',
      },
      1.4,
    )
    .to(
      el.caps,
      {
        textShadow:
          '0 0 10px rgba(156,194,255,.7), 0 0 30px rgba(74,127,212,.55), 0 0 70px rgba(74,127,212,.3)',
        duration: 0.9,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: 1,
      },
      2.6,
    )
    .to(
      wire,
      {
        n: scene.wireframeCount,
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate: () =>
          scene.wireframe.geometry.setDrawRange(0, Math.floor(wire.n)),
      },
      0.1,
    )
    .to(moonU.uReveal, { value: 1, duration: 1.2, ease: 'power2.out' }, 1.4)
    .to(scene.wireframe.material, { opacity: 0, duration: 0.9 }, 2.1);
  // Terminator sweep: the light swings from behind the Moon to its final place.
  tl.fromTo(
    sweep,
    { a: 0 },
    {
      a: 1,
      duration: 2.2,
      ease: 'power2.inOut',
      onUpdate: () => scene.sweepSun(sweep.a),
    },
    0.6,
  );
  tl.addLabel('ready', READY_AT);
  tl.addPause('ready');

  let started = false;
  let killed = false;
  let exit: gsap.core.Timeline | null = null;

  const go = () => {
    if (started || killed) return;
    started = true;
    tl.seek('ready');
    exit = gsap
      .timeline({ onComplete: onFinish })
      .to(el.capL, { x: -60, opacity: 0, duration: 0.6, ease: 'power3.in' }, 0)
      .to(el.capR, { x: 60, opacity: 0, duration: 0.6, ease: 'power3.in' }, 0)
      .to([el.pct, el.ring, el.skip], { opacity: 0, duration: 0.5 }, 0)
      .to(el.line, { scaleX: 1, duration: 0.6, ease: 'expo.inOut' }, 0)
      .to(el.top, { yPercent: -100, duration: 1.2, ease: 'expo.inOut' }, 0.45)
      .to(el.bot, { yPercent: 100, duration: 1.2, ease: 'expo.inOut' }, 0.45)
      .to(el.line, { opacity: 0, duration: 0.4 }, 0.6)
      .to(P, { intro: 1, duration: 2.0, ease: 'expo.inOut' }, 0.45)
      .to(scene.starUniforms.uAlpha, { value: 1, duration: 1.8 }, 0.8)
      .to(scene.dustMaterial, { opacity: 0.5, duration: 1.8 }, 1)
      .to(earthU.uAlpha, { value: 1, duration: 1.6, ease: 'power2.out' }, 0.9)
      // The astronaut drifts in at the centre of the screen...
      .to(P, { show: 1, duration: 1.6, ease: 'expo.out' }, 1.3)
      .fromTo(
        P,
        { spin: 0 },
        { spin: 1, duration: 3.2, ease: 'power2.out' },
        1.3,
      )
      .to(P, { sunA: 1, duration: 1.6, ease: 'power2.out' }, 0.9)
      // ...then glides to the side as the copy arrives.
      .to(P, { astro: 1, duration: 1.6, ease: 'none' }, 2.6)
      .to(P, { frame: 1, duration: 0.9, ease: 'power2.out' }, 3.4)
      .to(
        el.lines,
        { yPercent: 0, duration: 1.3, stagger: 0.12, ease: 'expo.out' },
        3.0,
      )
      .to(
        el.fades,
        { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: 'expo.out' },
        3.2,
      );
  };

  return {
    go,
    async waitReady() {
      while (tl.time() < READY_AT && !started && !killed) {
        await new Promise((r) => setTimeout(r, 100));
      }
      go();
    },
    kill() {
      killed = true;
      tl.kill();
      exit?.kill();
    },
  };
}
