'use client';

import { useState, type ReactNode } from 'react';

import { useReducedMotion } from '@/lib/motion/reduced-motion';

import styles from './future-demos.module.css';

/**
 * The frame of a looping illustration: its label and a Pause button. Content that starts moving
 * by itself and runs for more than 5 seconds needs a way to pause it (WCAG 2.2 success criterion
 * 2.2.2, https://www.w3.org/TR/WCAG22/#pause-stop-hide). With reduced motion the picture is
 * still, so there is no button.
 */
export function LoopBox({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  return (
    <div className={styles.box} data-paused={paused ? '' : undefined}>
      <div className={styles.head}>
        <p className={styles.label}>{label}</p>
        {reduced ? null : (
          <button
            type="button"
            className={styles.pause}
            aria-label={paused ? 'Play the animation' : 'Pause the animation'}
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? 'Play' : 'Pause'}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
