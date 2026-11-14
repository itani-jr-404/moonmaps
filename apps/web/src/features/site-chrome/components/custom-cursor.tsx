'use client';

import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import { hasFinePointer, useReducedMotion } from '@/lib/motion/reduced-motion';
import styles from './custom-cursor.module.css';

/** Elements that make the ring grow, as in the prototype. */
const HOVERABLE = 'a,button,input,select,label,.tip';

/*
  Hides the system cursor while the custom one is running. Plain global rules, because
  a CSS module cannot target <html> alone; only applied on a mouse or trackpad.
*/
const HIDE_SYSTEM_CURSOR =
  '@media (hover:hover) and (pointer:fine){html.has-cursor,html.has-cursor *{cursor:none!important}}';

/**
 * A small dot that follows the mouse exactly and a ring that trails it. The ring grows over
 * links and buttons and shows DRAG over `[data-cursor="drag"]`. Mouse only, full motion only.
 */
export function CustomCursor() {
  const reduced = useReducedMotion();
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (reduced || !hasFinePointer() || !dot || !ring || !label) return;
    const html = document.documentElement;
    html.classList.add('has-cursor');

    const dx = gsap.quickSetter(dot, 'x', 'px');
    const dy = gsap.quickSetter(dot, 'y', 'px');
    const rx = gsap.quickTo(ring, 'x', { duration: 0.16, ease: 'power2.out' });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.16, ease: 'power2.out' });
    let visible = false;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (!visible) {
        visible = true;
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
        gsap.to([dot, ring], { opacity: 1, duration: 0.3, overwrite: 'auto' });
      }
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    };
    // Hide when the mouse leaves the window; the next movement brings it back.
    const onLeave = () => {
      visible = false;
      gsap.to([dot, ring], { opacity: 0, duration: 0.25, overwrite: 'auto' });
    };
    const onBlur = () => {
      visible = false;
      gsap.set([dot, ring], { opacity: 0 });
    };
    const onOver = (e: PointerEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      const drag = !!el?.closest('[data-cursor="drag"]');
      const hover = !!el?.closest(HOVERABLE);
      gsap.to(ring, {
        scale: drag ? 2.1 : hover ? 1.6 : 1,
        backgroundColor:
          hover || drag ? 'rgba(74,127,212,.12)' : 'rgba(74,127,212,0)',
        duration: 0.35,
        ease: 'expo.out',
        overwrite: 'auto',
      });
      gsap.to(dot, {
        scale: hover ? 0.5 : 1,
        duration: 0.3,
        overwrite: 'auto',
      });
      label.textContent = drag ? 'DRAG' : '';
      gsap.to(label, { opacity: drag ? 1 : 0, duration: 0.2 });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    html.addEventListener('mouseleave', onLeave);
    window.addEventListener('blur', onBlur);
    document.addEventListener('pointerover', onOver);
    return () => {
      window.removeEventListener('pointermove', onMove);
      html.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('pointerover', onOver);
      html.classList.remove('has-cursor');
      gsap.killTweensOf([dot, ring, label]);
      gsap.set([dot, ring], { opacity: 0 });
    };
  }, [reduced]);

  return (
    <>
      <style>{HIDE_SYSTEM_CURSOR}</style>
      <div ref={dotRef} className={styles.dot} aria-hidden="true" />
      <div ref={ringRef} className={styles.ring} aria-hidden="true">
        <span ref={labelRef} className={styles.label} />
      </div>
    </>
  );
}
