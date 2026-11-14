'use client';

import gsap from 'gsap';
import { useEffect, useRef } from 'react';

import { errorMessage } from '@/lib/api/client';
import { fmtShort, fmtWhen, plainDuration } from '@/lib/format/format';
import { useReducedMotion } from '@/lib/motion/reduced-motion';
import { ErrorState, LoadingState } from '@/components/ui/states';
import type { PlannerVerdict } from '../hooks/use-planner';
import styles from './verdict-card.module.css';

function whyText(v: PlannerVerdict): string {
  if (v.good)
    return 'The solar panels get sunlight and the lander can radio Earth directly. A safe choice.';
  if (!v.sun && !v.earth)
    return 'It is dark here and Earth is out of sight. No power and no direct contact with home.';
  if (!v.sun)
    return 'Earth is in view, but the Sun is hidden. The lander would have no solar power.';
  return 'There is sunlight, but Earth is hidden behind the horizon. The lander could not talk to home without a relay satellite.';
}

function sunText(v: PlannerVerdict): string {
  if (v.sun)
    return v.nextSunset !== null
      ? `Yes, for the next ${plainDuration(v.nextSunset - v.t)}`
      : 'Yes, for more than a month';
  return v.nextSunrise !== null
    ? `No. Sunlight returns ${fmtShort(v.nextSunrise)}`
    : 'No sunlight in the next month';
}

function earthText(v: PlannerVerdict): string {
  if (v.earth)
    return v.nextEarthset !== null
      ? `Yes, for the next ${plainDuration(v.nextEarthset - v.t)}`
      : 'Yes, for more than a month';
  return v.nextEarthrise !== null
    ? `No. Earth comes back into view ${fmtShort(v.nextEarthrise)}`
    : 'Earth stays hidden for the next month';
}

function Fact({
  ok,
  icon,
  label,
  text,
}: {
  ok: boolean | null;
  icon: string;
  label: string;
  text: string;
}) {
  return (
    <div
      className={`${styles.fact} ${ok === false ? styles.no : ''}`}
      data-testid={`fact-${label === 'Sunlight for power' ? 'sun' : 'earth'}`}
      data-ok={ok === null ? undefined : String(ok)}
    >
      <span className={`${styles.icon} ${icon}`} aria-hidden="true" />
      <div>
        <b className={styles.factLabel}>{label}</b>
        <span className={styles.factText}>{text}</span>
      </div>
    </div>
  );
}

/** The big answer: GOOD (bright green glow) or BAD (dark), with the two facts behind it. */
export function VerdictCard({
  verdict,
  isPending,
  isUpdating,
  error,
  onRetry,
}: {
  verdict: PlannerVerdict | null;
  isPending: boolean;
  isUpdating: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  const reduced = useReducedMotion();
  const verdictRef = useRef<HTMLHeadingElement>(null);
  const shown = useRef<boolean | null>(null);
  const good = verdict?.good ?? null;

  // The verdict pops in each time the answer flips between good and bad.
  useEffect(() => {
    if (good === null || good === shown.current) return;
    shown.current = good;
    const el = verdictRef.current;
    if (reduced || !el) return;
    const tween = gsap.fromTo(
      el,
      { scale: 0.85, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(1.8)' },
    );
    return () => {
      tween.kill();
      gsap.set(el, { clearProps: 'transform,opacity' });
    };
  }, [good, reduced]);

  const state = good === null ? '' : good ? styles.good : styles.bad;

  return (
    <div
      className={`${styles.card} ${state}`}
      data-reveal
      data-testid="planner-answer"
      data-verdict={good === null ? undefined : good ? 'good' : 'bad'}
    >
      <div className={styles.glow} aria-hidden="true" />
      {isUpdating ? (
        <p className={styles.updating} role="status">
          Updating…
        </p>
      ) : null}
      <div aria-live="polite">
        <p className={styles.kicker}>Our answer for</p>
        <p className={styles.where}>{verdict?.where ?? '--'}</p>
        <p className={styles.when}>{verdict ? fmtWhen(verdict.t) : '--'}</p>
        <h3 ref={verdictRef} className={styles.verdict}>
          {verdict
            ? verdict.good
              ? 'Good landing site'
              : 'Bad landing site'
            : '--'}
        </h3>
        {verdict ? (
          <p className={styles.why}>{whyText(verdict)}</p>
        ) : isPending && !error ? (
          <LoadingState />
        ) : null}
        {error ? (
          <div className="mt-4">
            <ErrorState message={errorMessage(error)} onRetry={onRetry} />
          </div>
        ) : null}
        <div className={styles.facts}>
          <Fact
            ok={verdict?.sun ?? null}
            icon={styles.iconSun ?? ''}
            label="Sunlight for power"
            text={verdict ? sunText(verdict) : '--'}
          />
          <Fact
            ok={verdict?.earth ?? null}
            icon={styles.iconEarth ?? ''}
            label="Can talk to Earth"
            text={verdict ? earthText(verdict) : '--'}
          />
        </div>
      </div>
    </div>
  );
}
