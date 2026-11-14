'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect } from 'react';
import { useReducedMotion } from '@/lib/motion/reduced-motion';
import { useIntroStore } from '@/lib/state/intro-store';

/** After the DOM changes, look for new blocks at most this often, so a burst of renders is one scan. */
const RESCAN_DELAY_MS = 120;

/**
 * Scroll reveals for the whole page, started once the intro has finished:
 * `[data-reveal]` blocks rise and fade in, and the `.li` lines of `[data-lines]` headings slide
 * up out of their masks. Blocks rendered later (after data loads) are picked up too.
 * With reduced motion nothing is animated and everything stays visible.
 */
export function Reveals() {
  const introDone = useIntroStore((s) => s.done);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!introDone || reduced) return;
    const seen = new WeakSet<Element>();
    const ctx = gsap.context(() => {});

    // If an animation cannot be set up, the block is shown as it is rather than left hidden.
    const safely = (targets: Element[], make: () => void) => {
      try {
        make();
      } catch {
        gsap.set(targets, { clearProps: 'transform,opacity' });
      }
    };

    /** Sets up every block not seen yet. Returns true when there were new ones. */
    const scan = (): boolean => {
      let added = false;
      ctx.add(() => {
        document.querySelectorAll('[data-reveal]').forEach((el) => {
          if (seen.has(el)) return;
          seen.add(el);
          added = true;
          safely([el], () =>
            gsap.from(el, {
              y: 40,
              opacity: 0,
              duration: 1,
              ease: 'expo.out',
              // Hand the block back to its own CSS when done, so hover lifts on cards still work.
              clearProps: 'transform,opacity',
              scrollTrigger: { trigger: el, start: 'top 90%', once: true },
            }),
          );
        });
        document.querySelectorAll('[data-lines]').forEach((heading) => {
          if (seen.has(heading)) return;
          seen.add(heading);
          const lines = Array.from(heading.querySelectorAll('.li'));
          if (lines.length === 0) return;
          added = true;
          safely(lines, () =>
            gsap.from(lines, {
              yPercent: 115,
              duration: 1.2,
              ease: 'expo.out',
              stagger: 0.12,
              scrollTrigger: { trigger: heading, start: 'top 88%', once: true },
            }),
          );
        });
      });
      return added;
    };

    scan();
    ScrollTrigger.refresh();

    // Throttled rather than debounced: text that changes all the time (a clock, a hover
    // read-out) must not keep postponing the scan.
    let timer: number | undefined;
    const observer = new MutationObserver(() => {
      if (timer !== undefined) return;
      timer = window.setTimeout(() => {
        timer = undefined;
        if (scan()) ScrollTrigger.refresh();
      }, RESCAN_DELAY_MS);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      // Puts every block back to its natural, visible state.
      ctx.revert();
    };
  }, [introDone, reduced]);

  return null;
}
