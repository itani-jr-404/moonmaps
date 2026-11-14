'use client';

import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import { useReducedMotion } from '@/lib/motion/reduced-motion';
import styles from './site-footer.module.css';

/** The giant outlined "LUNA" that rises into place as the footer scrolls in. Static with reduced motion. */
export function FooterWatermark() {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const word = wordRef.current;
    const footer = wrapRef.current?.closest('footer');
    if (reduced || !word || !footer) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        word,
        { yPercent: 30 },
        {
          yPercent: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: footer,
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: true,
          },
        },
      );
    });
    return () => ctx.revert();
  }, [reduced]);

  return (
    <div ref={wrapRef} className={styles.wmWrap} aria-hidden="true">
      <div ref={wordRef} className={styles.wm}>
        LUNA
      </div>
    </div>
  );
}
