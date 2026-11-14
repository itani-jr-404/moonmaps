'use client';

import clsx from 'clsx';
import gsap from 'gsap';
import { useEffect, useRef } from 'react';

import { useReducedMotion } from '@/lib/motion/reduced-motion';

import type { AimState } from '../hooks/use-landing';
import { isGood, verdictText, whyText } from '../lib/verdict';
import styles from './landing.module.css';

/** The card beside the red arrow: the API's verdict for the aimed spot right now. */
export function AimCard({ aim }: { aim: AimState }) {
  const verdictRef = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const ok = aim.status === 'ok';
  const good = ok && isGood(aim.sun, aim.earth);
  const verdictKey = ok ? String(good) : aim.status;

  // A small pop when the verdict changes, so a flip from good to bad is noticed.
  useEffect(() => {
    const el = verdictRef.current;
    if (!el || reduce || verdictKey === 'checking') return;
    const tween = gsap.fromTo(
      el,
      { scale: 0.8, opacity: 0.2 },
      { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2)' },
    );
    return () => {
      tween.kill();
    };
  }, [verdictKey, reduce]);

  return (
    <div
      className={clsx(styles.card, ok && (good ? styles.good : styles.bad))}
      data-testid="aim-card"
      data-verdict={ok ? (good ? 'good' : 'bad') : aim.status}
    >
      <b>Land here?</b>
      <span
        ref={verdictRef}
        className={clsx(styles.verdict, 'font-display')}
        data-state={aim.status}
      >
        {ok
          ? verdictText(good)
          : aim.status === 'checking'
            ? 'Checking…'
            : 'Could not check this spot'}
      </span>
      <span className={clsx(styles.place, 'mono')}>{aim.label}</span>
      {ok ? (
        <>
          <span className={clsx(styles.read, 'font-mono')}>
            Sunlight right now:{' '}
            <i className="text-sun not-italic">{aim.sun ? 'Yes' : 'No'}</i>
            <br />
            Can see Earth:{' '}
            <u className="text-earth no-underline">
              {aim.earth ? 'Yes' : 'No'}
            </u>
          </span>
          <span className={styles.why}>{whyText(aim.sun, aim.earth)}</span>
        </>
      ) : null}
      <small className="text-faint">Click to land here</small>
    </div>
  );
}
