'use client';

import gsap from 'gsap';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import * as THREE from 'three';

import { useToast } from '@/components/ui/toast';
import { errorMessage, type Site, type SkyResponse } from '@/lib/api/client';
import { fetchSkyRounded } from '@/lib/api/fetch-sky';
import { compassWord } from '@/lib/format/format';
import { prefersReducedMotion } from '@/lib/motion/reduced-motion';
import { useSmoothScroll } from '@/lib/motion/smooth-scroll';
import { useScenarioStore } from '@/lib/state/scenario-store';
import { createRenderer, observeVisibility } from '@/scene/renderer';
import { moonMaps } from '@/scene/textures';

import {
  CAM_NEAR_Z,
  CAM_Z,
  GlobeScene,
  HALO_OPACITY,
  type GlobeHit,
} from '../lib/globe-scene';
import { fetchNextSunrise, fetchSkyAt } from '../lib/landing-api';
import { SurfaceScene } from '../lib/surface-scene';
import { nearestSite, spotLabel } from '../lib/verdict';

/*
 * State machine of "Choose your landing": orbit (aiming at the globe), busy
 * (an animation is running) and surface (standing on the chosen point).
 *
 * The three.js scenes, pointer handling and the render loop live in one
 * effect and talk to React only when something a person reads changes (the
 * aim card, the HUD), never per frame.
 */

export type GlobeStatus = 'loading' | 'ready' | 'unsupported';
export type CheckStatus = 'checking' | 'ok' | 'error';

export interface AimState {
  key: string;
  label: string;
  status: CheckStatus;
  sun: boolean;
  earth: boolean;
}

export interface LandedState {
  lat: number;
  lon: number;
  siteId: string | null;
  place: string;
  /** The moment the HUD describes (the time of the last API answer). */
  timeMs: number;
  /** How far "Skip to sunrise" moved the clock ahead of now. */
  offsetMs: number;
  status: CheckStatus;
  sun: boolean;
  earth: boolean;
}

/** Wait for the pointer to settle before asking the API about an aimed point. */
const AIM_DEBOUNCE_MS = 120;
/** The landed sky is asked for again this often. */
const SKY_REFRESH_MS = 60_000;
/*
 * next_sunrise is interpolated between 30-minute samples, so it can sit right
 * on the horizon edge; looking a quarter of an hour later lands on the lit side.
 */
const SUNRISE_MARGIN_MS = 15 * 60_000;
const NO_SITES: readonly Site[] = [];

interface Landed {
  lat: number;
  lon: number;
  siteId: string | null;
  place: string;
  offsetMs: number;
  timeMs: number;
  status: CheckStatus;
  sky: SkyResponse | null;
}

interface Controls {
  backToOrbit: () => void;
  skipToSunrise: () => void;
  retrySky: () => void;
}

const round = (v: number, digits: number) => {
  const k = 10 ** digits;
  return Math.round(v * k) / k;
};

/** The renderer, or null when the browser has no WebGL. */
function tryCreateRenderer(
  canvas: HTMLCanvasElement,
): THREE.WebGLRenderer | null {
  try {
    return createRenderer({ canvas });
  } catch {
    return null;
  }
}

function isInHud(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('[data-hud]') !== null;
}

/** Elements the hook drives directly (the component owns the refs). */
export interface LandingElements {
  stageRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** The aim card wrapper, moved with the pointer. */
  lzRef: RefObject<HTMLDivElement | null>;
  flashRef: RefObject<HTMLDivElement | null>;
}

export function useLanding(
  { stageRef, canvasRef, lzRef, flashRef }: LandingElements,
  sites: readonly Site[] | undefined,
) {
  const sitesRef = useRef<readonly Site[]>(NO_SITES);
  const globeRef = useRef<GlobeScene | null>(null);
  const controlsRef = useRef<Controls | null>(null);

  const [status, setStatus] = useState<GlobeStatus>('loading');
  const [view, setView] = useState<'orbit' | 'surface'>('orbit');
  const [busy, setBusy] = useState(false);
  const [aim, setAim] = useState<AimState | null>(null);
  const [landed, setLanded] = useState<LandedState | null>(null);
  const [facing, setFacing] = useState('north');
  const [sunriseBusy, setSunriseBusy] = useState(false);
  const { scrollTo } = useSmoothScroll();

  useEffect(() => {
    const stageEl = stageRef.current;
    const canvasEl = canvasRef.current;
    const lzEl = lzRef.current;
    const flashEl = flashRef.current;
    if (!stageEl || !canvasEl || !lzEl || !flashEl) return;
    // Non-null aliases, so the handlers below need no checks.
    const stage: HTMLDivElement = stageEl;
    const canvas: HTMLCanvasElement = canvasEl;
    const lz: HTMLDivElement = lzEl;
    const flash: HTMLDivElement = flashEl;

    const renderer = tryCreateRenderer(canvas);
    if (!renderer) {
      // WebGL can only be tested in the browser.
      setStatus('unsupported');
      return;
    }
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const reduce = prefersReducedMotion();
    const d = (seconds: number) => (reduce ? 0 : seconds);
    const toast = (message: string) => useToast.getState().show(message);
    const root = document.documentElement;
    const globe = new GlobeScene(reduce);
    const surface = new SurfaceScene();
    globe.setSites(sitesRef.current);
    globeRef.current = globe;

    let alive = true;
    const ready = () => {
      if (alive) setStatus('ready');
    };
    // The procedural Moon stays if the maps fail, so either way the globe is ready.
    moonMaps().then(ready, ready);

    let mode: 'orbit' | 'busy' | 'surface' = 'orbit';
    let showing: 'orbit' | 'surface' = 'orbit';
    let drag: {
      x: number;
      y: number;
      lx: number;
      ly: number;
      moved: boolean;
    } | null = null;
    let aiming = false;
    let aimKey = '';
    let aimSeq = 0;
    let aimTimer: ReturnType<typeof setTimeout> | undefined;
    let current: Landed | null = null;
    let arrived = false;
    let skySeq = 0;
    let skyClock = 0;
    let facingWord = '';
    const timelines = new Set<gsap.core.Timeline>();
    const track = (tl: gsap.core.Timeline) => {
      timelines.add(tl);
      tl.eventCallback('onComplete', () => timelines.delete(tl));
      return tl;
    };

    /* ---------- aiming ---------- */

    function clearAim() {
      if (!aimKey) return;
      aimKey = '';
      aimSeq++;
      clearTimeout(aimTimer);
      setAim(null);
    }

    function show(h: GlobeHit | null) {
      aiming = h !== null;
      root.classList.toggle('aiming', aiming);
      if (!h) {
        lz.removeAttribute('data-on');
        globe.setAim(null);
        clearAim();
        return;
      }
      lz.setAttribute('data-on', '');
      lz.style.transform = `translate(${h.x}px, ${h.y}px)`;
      lz.toggleAttribute('data-flip', h.x > h.w * 0.62);
      lz.toggleAttribute('data-up', h.y > h.h * 0.5);
      globe.setAim(h.local);

      // Near a curated site the verdict is for the site itself, where a click lands.
      const site = nearestSite(sitesRef.current, h.lat, h.lon);
      const lat = site ? site.lat : round(h.lat, 1);
      const lon = site ? site.lon : round(h.lon, 1);
      const key = site ? `site:${site.id}` : `${lat},${lon}`;
      if (key === aimKey) return;
      aimKey = key;
      setAim({
        key,
        label: site ? site.name : spotLabel(lat, lon),
        status: 'checking',
        sun: false,
        earth: false,
      });
      clearTimeout(aimTimer);
      const seq = ++aimSeq;
      aimTimer = setTimeout(() => {
        fetchSkyRounded(lat, lon, new Date()).then(
          (sky) => {
            if (seq !== aimSeq) return;
            setAim((a) =>
              a && a.key === key
                ? {
                    ...a,
                    status: 'ok',
                    sun: sky.sun.visible,
                    earth: sky.earth.visible,
                  }
                : a,
            );
          },
          () => {
            if (seq !== aimSeq) return;
            setAim((a) => (a && a.key === key ? { ...a, status: 'error' } : a));
          },
        );
      }, AIM_DEBOUNCE_MS);
    }

    /* ---------- the landed point ---------- */

    function publishLanded() {
      const l = current;
      setLanded(
        l
          ? {
              lat: l.lat,
              lon: l.lon,
              siteId: l.siteId,
              place: l.place,
              timeMs: l.timeMs,
              offsetMs: l.offsetMs,
              status: l.status,
              sun: l.sky?.sun.visible ?? false,
              earth: l.sky?.earth.visible ?? false,
            }
          : null,
      );
    }

    function publishFacing() {
      const word = compassWord(surface.facingDeg());
      if (word === facingWord) return;
      facingWord = word;
      setFacing(word);
    }

    function requestSky(timeMs: number) {
      const l = current;
      if (!l) return;
      const seq = ++skySeq;
      if (!l.sky) {
        l.status = 'checking';
        publishLanded();
      }
      fetchSkyAt(l.lat, l.lon, timeMs).then(
        (sky) => {
          if (seq !== skySeq || current !== l) return;
          const first = l.sky === null;
          l.sky = sky;
          l.timeMs = timeMs;
          l.status = 'ok';
          if (arrived) {
            // The first answer can come after the descent: turn to the Sun then.
            if (first) surface.frame(sky);
            else surface.setSky(sky);
            publishFacing();
          }
          publishLanded();
        },
        () => {
          if (seq !== skySeq || current !== l) return;
          // A failed refresh keeps the last answer; only a first failure is shown.
          if (!l.sky) {
            l.status = 'error';
            publishLanded();
          }
        },
      );
    }

    function land(h: GlobeHit) {
      mode = 'busy';
      setBusy(true);
      show(null);
      const site = nearestSite(sitesRef.current, h.lat, h.lon);
      const now = Date.now();
      const l: Landed = {
        lat: site ? site.lat : round(h.lat, 4),
        lon: site ? site.lon : round(h.lon, 4),
        siteId: site?.id ?? null,
        place: site ? site.name : 'Your chosen spot',
        offsetMs: 0,
        timeMs: now,
        status: 'checking',
        sky: null,
      };
      current = l;
      arrived = false;
      requestSky(now);
      surface.build(l.lat, l.lon);

      // Turn the Moon so the chosen point faces the camera, dive in, flash.
      const turn = globe.turnToward(h.local);
      const o = { t: 0 };
      track(
        gsap
          .timeline()
          .to(o, {
            t: 1,
            duration: d(1.1),
            ease: 'power3.inOut',
            onUpdate: () => turn(o.t),
          })
          .to(
            globe.camera.position,
            { z: CAM_NEAR_Z, duration: d(1.5), ease: 'expo.in' },
            d(0.6),
          )
          .to(globe.haloMaterial, { opacity: 0, duration: d(0.6) }, d(0.8))
          .to(
            flash,
            { opacity: 1, duration: d(0.25), ease: 'power2.in' },
            reduce ? '>' : '-=0.2',
          )
          .add(() => {
            if (current !== l) return;
            mode = 'surface';
            showing = 'surface';
            arrived = true;
            surface.arrive(l.sky, d);
            skyClock = performance.now();
            setView('surface');
            setBusy(false);
            publishFacing();
            publishLanded();
          })
          .to(flash, { opacity: 0, duration: d(0.8), ease: 'power2.out' }),
      );
    }

    function backToOrbit() {
      if (mode !== 'surface') return;
      mode = 'busy';
      setBusy(true);
      skySeq++;
      track(
        gsap
          .timeline()
          .to(flash, { opacity: 1, duration: d(0.25) })
          .add(() => {
            showing = 'orbit';
            current = null;
            arrived = false;
            surface.resetView();
            globe.camera.position.z = CAM_NEAR_Z;
            setView('orbit');
            setLanded(null);
          })
          .to(flash, { opacity: 0, duration: d(0.5) })
          .to(
            globe.camera.position,
            { z: CAM_Z, duration: d(1.3), ease: 'expo.out' },
            '<',
          )
          .to(
            globe.haloMaterial,
            { opacity: HALO_OPACITY, duration: d(0.8) },
            reduce ? '<' : '<0.3',
          )
          .add(() => {
            mode = 'orbit';
            setBusy(false);
          }),
      );
    }

    async function skipToSunrise() {
      const l = current;
      if (!l || mode !== 'surface') return;
      setSunriseBusy(true);
      try {
        const rise = await fetchNextSunrise(
          l.lat,
          l.lon,
          Date.now() + l.offsetMs,
        );
        if (current !== l) return;
        if (rise.sunriseMs === null) {
          if (!rise.sunVisibleAtStart)
            toast('The Sun does not rise here in the next 35 days.');
          return;
        }
        const t = rise.sunriseMs + SUNRISE_MARGIN_MS;
        const sky = await fetchSkyAt(l.lat, l.lon, t);
        if (current !== l) return;
        skySeq++; // a refresh still in flight would show the old time
        track(
          gsap
            .timeline()
            .to(flash, { opacity: 0.8, duration: d(0.25) })
            .add(() => {
              if (current !== l) return;
              l.offsetMs = t - Date.now();
              l.timeMs = t;
              l.sky = sky;
              l.status = 'ok';
              surface.frame(sky);
              skyClock = performance.now();
              publishFacing();
              publishLanded();
            })
            .to(flash, { opacity: 0, duration: d(0.6) }),
        );
      } catch (err) {
        if (current === l) toast(errorMessage(err));
      } finally {
        if (alive) setSunriseBusy(false);
      }
    }

    controlsRef.current = {
      backToOrbit,
      skipToSunrise: () => void skipToSunrise(),
      retrySky: () => {
        if (current) requestSky(Date.now() + current.offsetMs);
      },
    };

    /* ---------- pointer ---------- */

    const onDown = (e: PointerEvent) => {
      if (mode === 'busy' || isInHud(e.target)) return;
      drag = {
        x: e.clientX,
        y: e.clientY,
        lx: e.clientX,
        ly: e.clientY,
        moved: false,
      };
      stage.setPointerCapture(e.pointerId);
      globe.setVelocity(0, 0);
    };
    const onMove = (e: PointerEvent) => {
      if (mode === 'surface') {
        if (!drag) return;
        surface.lookBy(e.clientX - drag.lx, e.clientY - drag.ly);
        drag.lx = e.clientX;
        drag.ly = e.clientY;
        publishFacing();
        return;
      }
      if (mode !== 'orbit') return;
      if (drag) {
        if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 4)
          drag.moved = true;
        if (drag.moved) {
          const dx = (e.clientX - drag.lx) * 0.006;
          const dy = (e.clientY - drag.ly) * 0.006;
          globe.spinBy(dx, dy);
          globe.setVelocity(dx, dy);
          drag.lx = e.clientX;
          drag.ly = e.clientY;
          show(null);
          return;
        }
      }
      show(globe.hit(e.clientX, e.clientY, canvas.getBoundingClientRect()));
    };
    const onUp = (e: PointerEvent) => {
      const was = drag;
      drag = null;
      if (stage.hasPointerCapture(e.pointerId))
        stage.releasePointerCapture(e.pointerId);
      if (mode !== 'orbit' || !was || was.moved) return;
      const h = globe.hit(e.clientX, e.clientY, canvas.getBoundingClientRect());
      if (h) land(h);
    };
    const onCancel = () => {
      drag = null;
    };
    const onLeave = () => {
      if (!drag && mode === 'orbit') show(null);
    };
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onCancel);
    stage.addEventListener('pointerleave', onLeave);

    /* ---------- size, visibility, render loop ---------- */

    const resize = () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      globe.setSize(w, h);
      surface.setSize(w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(stage);

    let visible = false;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      raf = 0;
      if (!visible) return;
      const dt = Math.min(50, now - last) / 1000;
      last = now;
      if (showing === 'surface') {
        if (current && now - skyClock > SKY_REFRESH_MS) {
          skyClock = now;
          requestSky(Date.now() + current.offsetMs);
        }
        surface.render(renderer, dt, now / 1000);
      } else {
        if (mode === 'orbit') globe.updateMotion(dt, drag !== null, aiming);
        globe.render(renderer, now / 1000);
      }
      raf = requestAnimationFrame(loop);
    };
    const stopObserving = observeVisibility(stage, (v) => {
      visible = v;
      if (v && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });

    return () => {
      alive = false;
      stopObserving();
      cancelAnimationFrame(raf);
      ro.disconnect();
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onCancel);
      stage.removeEventListener('pointerleave', onLeave);
      clearTimeout(aimTimer);
      aimSeq++;
      skySeq++;
      for (const tl of timelines) tl.kill();
      gsap.killTweensOf(flash);
      flash.style.opacity = '';
      root.classList.remove('aiming');
      controlsRef.current = null;
      globeRef.current = null;
      globe.dispose();
      surface.dispose();
      renderer.dispose();
    };
  }, [stageRef, canvasRef, lzRef, flashRef]);

  // Pins and the nearest-site lookup follow the site list; without it, aims use coordinates.
  useEffect(() => {
    const list = sites ?? NO_SITES;
    sitesRef.current = list;
    globeRef.current?.setSites(list);
  }, [sites]);

  const backToOrbit = useCallback(() => controlsRef.current?.backToOrbit(), []);
  const skipToSunrise = useCallback(
    () => controlsRef.current?.skipToSunrise(),
    [],
  );
  const retrySky = useCallback(() => controlsRef.current?.retrySky(), []);

  const showBestDates = useCallback(() => {
    if (!landed) return;
    const { setPlace, setTime } = useScenarioStore.getState();
    setPlace(
      landed.siteId
        ? { kind: 'site', id: landed.siteId }
        : { kind: 'point', lat: landed.lat, lon: landed.lon },
    );
    setTime(Date.now() + landed.offsetMs);
    scrollTo(document.getElementById('navigator'));
    useToast.getState().show('Showing the best dates for this spot.');
  }, [landed, scrollTo]);

  return {
    status,
    view,
    busy,
    aim,
    landed,
    facing,
    sunriseBusy,
    backToOrbit,
    skipToSunrise,
    retrySky,
    showBestDates,
  };
}
