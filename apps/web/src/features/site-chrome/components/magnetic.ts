'use client';

import gsap from 'gsap';
import { useCallback, type RefCallback } from 'react';
import {
  hasFinePointer,
  prefersReducedMotion,
} from '@/lib/motion/reduced-motion';

/**
 * Magnetic pull for a button: it leans toward the pointer while hovered and its `.btn-label`
 * follows a little less, so the text seems to float. Only with a mouse and full motion.
 * Pull factors (0.3 / 0.4 for the button, 0.12 / 0.16 for the label) are the prototype's.
 */
export function useMagnetic<T extends HTMLElement>(): RefCallback<T> {
  return useCallback((el: T | null) => {
    if (!el || !hasFinePointer() || prefersReducedMotion()) return;
    const label = el.querySelector<HTMLElement>('.btn-label');
    const opts = { duration: 0.35, ease: 'power3.out' };
    const xTo = gsap.quickTo(el, 'x', opts);
    const yTo = gsap.quickTo(el, 'y', opts);
    const lxTo = label ? gsap.quickTo(label, 'x', opts) : null;
    const lyTo = label ? gsap.quickTo(label, 'y', opts) : null;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left - r.width / 2;
      const my = e.clientY - r.top - r.height / 2;
      xTo(mx * 0.3);
      yTo(my * 0.4);
      lxTo?.(mx * 0.12);
      lyTo?.(my * 0.16);
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
      lxTo?.(0);
      lyTo?.(0);
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      const targets = label ? [el, label] : [el];
      gsap.killTweensOf(targets);
      gsap.set(targets, { x: 0, y: 0 });
    };
  }, []);
}
