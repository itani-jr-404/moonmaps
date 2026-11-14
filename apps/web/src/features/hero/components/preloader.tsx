import type { Ref } from 'react';

import styles from './hero.module.css';

/**
 * The opening preloader: two half panels that split open, a progress ring,
 * the "Sun. Earth." / "Horizon." captions and a skip button. It has no
 * behaviour of its own; useHeroScene animates it through the data-pre hooks.
 * The wrapper has no position or z-index, so each layer keeps its own place
 * in the page's stacking order around the fixed 3D stage. Under reduced
 * motion it is never shown.
 */
export function Preloader({
  ref,
  progress,
}: {
  ref: Ref<HTMLDivElement>;
  progress: number;
}) {
  return (
    <div ref={ref} className={styles.preRoot}>
      <div className={styles.pre} aria-hidden="true">
        <div data-pre="top" className={`${styles.prePanel} ${styles.preTop}`} />
        <div data-pre="bot" className={`${styles.prePanel} ${styles.preBot}`} />
      </div>
      <div data-pre="line" className={styles.preLine} aria-hidden="true" />
      <div className={styles.preUi} aria-hidden="true">
        <svg data-pre="ring" className={styles.preRing} viewBox="0 0 100 100">
          <defs>
            <linearGradient id="hero-pre-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#4A7FD4" />
              <stop offset=".5" stopColor="#9CC2FF" />
              <stop offset="1" stopColor="#4A7FD4" />
            </linearGradient>
          </defs>
          <circle className={styles.preTrack} cx="50" cy="50" r="48" />
          <circle
            className={styles.preBar}
            cx="50"
            cy="50"
            r="48"
            pathLength={1}
            stroke="url(#hero-pre-grad)"
            style={{ strokeDashoffset: 1 - progress }}
          />
        </svg>
        <div
          data-pre="cap"
          data-side="l"
          className={`${styles.preCap} ${styles.preCapL} font-display`}
        >
          Sun. Earth.
        </div>
        <div
          data-pre="cap"
          data-side="r"
          className={`${styles.preCap} ${styles.preCapR} font-display`}
        >
          Horizon.
        </div>
        <div data-pre="pct" className={`${styles.prePct} font-mono`}>
          {Math.round(progress * 100)}%
        </div>
      </div>
      <button
        data-pre="skip"
        type="button"
        className={`${styles.preSkip} font-body`}
      >
        Skip intro
      </button>
    </div>
  );
}
