'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, useState, type RefObject } from 'react';

import { prefersReducedMotion } from '@/lib/motion/reduced-motion';
import { useSmoothScroll } from '@/lib/motion/smooth-scroll';
import { useIntroStore } from '@/lib/state/intro-store';
import { observeVisibility } from '@/scene/renderer';

import { showCopyNow, startIntro, type Intro } from '../lib/hero-intro';
import type { HeroScene } from '../lib/hero-scene';

/** Never hold the visitor on the preloader longer than this, whatever is still loading. */
const BOOT_CAP_MS = 6000;
/** Fonts, shader compile, astronaut model, first /sky answer. */
const BOOT_TASKS = 4;

export interface HeroSceneRefs {
  stage: RefObject<HTMLDivElement | null>;
  section: RefObject<HTMLElement | null>;
  pin: RefObject<HTMLDivElement | null>;
  copy: RefObject<HTMLDivElement | null>;
  preloader: RefObject<HTMLDivElement | null>;
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Owns the hero's 3D stage and the opening sequence: loads the scene, counts
 * real loading work on the preloader, plays the intro, then wires the scroll
 * dolly and the stage fade. The render loop runs only while the hero is on
 * screen and the tab is shown (hero-scene.ts checks document.hidden). Under
 * reduced motion the intro is skipped and the scene is drawn as still frames.
 * A click does nothing to the scene: the astronaut turns only once, in the intro.
 *
 * `skySettled` is true once the live readout's first /sky request has an
 * answer or has failed; the preloader counts it as one loading step.
 */
export function useHeroScene(refs: HeroSceneRefs, skySettled: boolean) {
  const [progress, setProgress] = useState(0);
  // A remount after the intro (fast refresh, navigation) never shows the preloader again.
  const [introDone, setIntroDone] = useState(
    () => useIntroStore.getState().done,
  );

  const scroll = useSmoothScroll();
  const scrollRef = useRef(scroll);
  const introDoneRef = useRef(introDone);
  const sky = useRef<{ settled: boolean; wake: (() => void) | null }>({
    settled: skySettled,
    wake: null,
  });

  useEffect(() => {
    scrollRef.current = scroll;
  });

  // Lenis can start after the intro locked scrolling; hold it until the intro ends.
  useEffect(() => {
    if (scroll.lenis && !introDoneRef.current) scroll.lenis.stop();
  }, [scroll.lenis]);

  useEffect(() => {
    sky.current.settled = skySettled;
    if (skySettled) {
      sky.current.wake?.();
      sky.current.wake = null;
    }
  }, [skySettled]);

  useEffect(() => {
    const stage = refs.stage.current;
    const section = refs.section.current;
    const pin = refs.pin.current;
    const copy = refs.copy.current;
    const pre = refs.preloader.current;
    if (!stage || !section || !pin || !copy) return;

    const skyState = sky.current;
    const reduced = prefersReducedMotion();
    const skipIntro = reduced || useIntroStore.getState().done;
    const lines = gsap.utils.toArray<HTMLElement>('.li', section);
    const fades = gsap.utils.toArray<HTMLElement>('[data-hero-fade]', section);
    const ctx = gsap.context(() => {});
    const lock = (on: boolean) => scrollRef.current.lock(on);

    let disposed = false;
    let finished = false;
    let scene: HeroScene | null = null;
    let intro: Intro | null = null;
    let skipRequested = false;
    const removers: Array<() => void> = [];
    // The loop draws only while the hero section is on screen and the stage has not faded out.
    let heroInView = true;
    let stageFaded = false;
    const syncVisible = () => scene?.setVisible(heroInView && !stageFaded);
    const stopObserving = observeVisibility(section, (v) => {
      heroInView = v;
      syncVisible();
    });

    const listen = <K extends keyof WindowEventMap>(
      type: K,
      fn: (e: WindowEventMap[K]) => void,
    ) => {
      window.addEventListener(type, fn);
      removers.push(() => window.removeEventListener(type, fn));
    };

    function initHeroScroll(s: HeroScene | null) {
      if (!reduced && s) {
        gsap.to(s.P, {
          dolly: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom top',
            scrub: 0.4,
          },
        });
      }
      if (stage) {
        // Fade the fixed stage out as the hero leaves, and stop drawing once it is gone.
        const apply = (p: number) => {
          stage.style.opacity = String(1 - p);
          stageFaded = p >= 1;
          syncVisible();
        };
        ScrollTrigger.create({
          trigger: section,
          start: 'bottom 85%',
          end: 'bottom 25%',
          onUpdate: (st) => apply(st.progress),
          onRefresh: (st) => apply(st.progress),
        });
      }
      if (!reduced) {
        gsap.to(pin, {
          yPercent: -14,
          opacity: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }
    }

    function finish() {
      if (finished || disposed) return;
      finished = true;
      introDoneRef.current = true;
      removers.splice(0).forEach((off) => off());
      if (!skipIntro) {
        lock(false);
        // Keep GSAP's lag smoothing during the intro so a busy first second never skips frames of it;
        // afterwards scrolling should follow Lenis exactly.
        gsap.ticker.lagSmoothing(0);
      }
      setIntroDone(true);
      useIntroStore.getState().finish();
      ctx.add(() => initHeroScroll(scene));
      ScrollTrigger.refresh();
    }

    const requestSkip = () => {
      if (finished) return;
      if (intro) ctx.add(() => intro?.go());
      else skipRequested = true;
    };

    if (!skipIntro) {
      lock(true);
      const skipButton =
        pre?.querySelector<HTMLElement>('[data-pre="skip"]') ?? null;
      if (skipButton) {
        skipButton.addEventListener('click', requestSkip);
        removers.push(() =>
          skipButton.removeEventListener('click', requestSkip),
        );
      }
      listen('keydown', requestSkip);
      listen('pointerdown', (e) => {
        if (
          e.target instanceof Element &&
          e.target.closest('[data-pre="skip"]')
        )
          return;
        requestSkip();
      });
    }

    const skyReady = () =>
      new Promise<void>((resolve) => {
        if (skyState.settled) resolve();
        else skyState.wake = resolve;
      });

    void (async () => {
      try {
        const { createHeroScene } = await import('../lib/hero-scene');
        if (disposed) return;
        scene = createHeroScene(stage, {
          animate: !reduced,
          getCopyLeft: () => copy.getBoundingClientRect().left,
        });
        syncVisible();
      } catch {
        // No WebGL or the chunk failed: the page works without the stage.
        scene = null;
      }
      if (disposed) return;

      if (!scene || skipIntro) {
        scene?.setFinalState();
        scene?.start();
        showCopyNow(lines, fades);
        finish();
        return;
      }

      const s = scene;
      const els = {
        caps: pre
          ? gsap.utils.toArray<HTMLElement>('[data-pre="cap"]', pre)
          : [],
        capL: pre?.querySelector<HTMLElement>('[data-side="l"]'),
        capR: pre?.querySelector<HTMLElement>('[data-side="r"]'),
        pct: pre?.querySelector<HTMLElement>('[data-pre="pct"]'),
        ring: pre?.querySelector('[data-pre="ring"]'),
        skip: pre?.querySelector<HTMLElement>('[data-pre="skip"]'),
        line: pre?.querySelector<HTMLElement>('[data-pre="line"]'),
        top: pre?.querySelector<HTMLElement>('[data-pre="top"]'),
        bot: pre?.querySelector<HTMLElement>('[data-pre="bot"]'),
      };
      const { capL, capR, pct, ring, skip, line, top, bot } = els;
      if (!capL || !capR || !pct || !ring || !skip || !line || !top || !bot) {
        s.setFinalState();
        s.start();
        showCopyNow(lines, fades);
        finish();
        return;
      }

      // The intro's own kill() stops its timelines on unmount.
      const created = startIntro(
        s,
        {
          caps: els.caps,
          capL,
          capR,
          pct,
          ring,
          skip,
          line,
          top,
          bot,
          lines,
          fades,
        },
        finish,
      );
      intro = created;
      s.start();
      if (skipRequested) requestSkip();

      let done = 0;
      const step = () => {
        done += 1;
        if (!disposed) setProgress(done / BOOT_TASKS);
      };
      const count = (p: Promise<unknown>) => p.then(step, step);
      const work = Promise.all([
        count(document.fonts ? document.fonts.ready : Promise.resolve()),
        // Let the preloader paint before the compile blocks the main thread.
        count(delay(40).then(() => s.compile())),
        count(s.astronaut),
        count(skyReady()),
      ]);
      await Promise.race([work, delay(BOOT_CAP_MS)]);
      if (disposed) return;
      await created.waitReady();
    })();

    return () => {
      disposed = true;
      removers.splice(0).forEach((off) => off());
      stopObserving();
      skyState.wake = null;
      intro?.kill();
      ctx.revert();
      scene?.dispose();
      if (!skipIntro) {
        if (finished) gsap.ticker.lagSmoothing(500, 33);
        else lock(false);
      }
    };
    // The stage is built once per mount; the refs are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { progress, introDone };
}
