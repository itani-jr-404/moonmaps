'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { prefersReducedMotion } from './reduced-motion';

gsap.registerPlugin(ScrollTrigger);

type Scroll = {
  lenis: Lenis | null;
  /** Scroll to an element (or the top when null), smoothly unless motion is reduced. */
  scrollTo: (target: HTMLElement | null) => void;
  /** Stop page scrolling while a menu or the intro is open. Calls are counted. */
  lock: (on: boolean) => void;
};

const ScrollContext = createContext<Scroll>({
  lenis: null,
  scrollTo: () => {},
  lock: () => {},
});
let lockCount = 0;

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const l = new Lenis({
      lerp: 0.16,
      wheelMultiplier: 1.05,
      smoothWheel: true,
    });
    l.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => l.raf(time * 1000);
    gsap.ticker.add(tick);
    // A lock taken before Lenis existed (the intro locks on its first effect) still applies.
    if (lockCount > 0) l.stop();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Lenis exists only in the browser
    setLenis(l);
    return () => {
      gsap.ticker.remove(tick);
      l.destroy();
      setLenis(null);
    };
  }, []);

  const value: Scroll = {
    lenis,
    scrollTo: (target) => {
      const reduce = prefersReducedMotion();
      if (lenis)
        lenis.scrollTo(target ?? 0, {
          offset: target ? -16 : 0,
          duration: 1.4,
        });
      else if (target)
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      else window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    },
    lock: (on) => {
      lockCount = Math.max(0, lockCount + (on ? 1 : -1));
      const locked = lockCount > 0;
      if (lenis) {
        if (locked) lenis.stop();
        else lenis.start();
      }
      document.documentElement.classList.toggle('is-locked', locked && !lenis);
    },
  };

  return (
    <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>
  );
}

export function useSmoothScroll(): Scroll {
  return useContext(ScrollContext);
}
