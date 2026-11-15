'use client';

import clsx from 'clsx';
import gsap from 'gsap';
import { useEffect, useRef } from 'react';

import { ErrorState, LoadingState } from '@/components/ui/states';
import { fmtShort } from '@/lib/format/format';
import { useReducedMotion } from '@/lib/motion/reduced-motion';

import type { LandedState } from '../hooks/use-landing';
import { isGood, verdictText, whyText } from '../lib/verdict';
import styles from './landing.module.css';
import { SpotOutlook } from './spot-outlook';

interface SurfaceHudProps {
  landed: LandedState;
  facing: string;
  busy: boolean;
  sunriseBusy: boolean;
  onBack: () => void;
  onSunrise: () => void;
  onBestDates: () => void;
  onRetry: () => void;
}

const yesNo = (v: boolean) => (v ? 'Yes' : 'No');

/** What the visitor reads while standing on the chosen spot. Every yes/no is the API's answer. */
export function SurfaceHud({
  landed,
  facing,
  busy,
  sunriseBusy,
  onBack,
  onSunrise,
  onBestDates,
  onRetry,
}: SurfaceHudProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const ok = landed.status === 'ok';
  const good = ok && isGood(landed.sun, landed.earth);
  const dark = ok && !landed.sun;

  // Rise in as the landing flash fades.
  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    const tween = gsap.from(el, {
      opacity: 0,
      y: 16,
      duration: 0.6,
      delay: 0.4,
      ease: 'power3.out',
    });
    return () => {
      tween.revert();
    };
  }, [reduce]);

  return (
    <div
      ref={ref}
      className={styles.hud}
      data-hud
      data-testid="surface-hud"
      data-verdict={ok ? (good ? 'good' : 'bad') : landed.status}
    >
      <div className={styles.hudTop}>
        <span className={styles.hudTag}>Landed</span>
        <b className="font-mono" data-testid="landed-place">
          {landed.place}
        </b>
        {landed.near ? (
          <span className="text-xs text-faint">near {landed.near}</span>
        ) : null}
      </div>
      {ok ? (
        <>
          <div
            className={clsx(
              styles.hudVerdict,
              'font-display',
              good ? styles.good : styles.bad,
            )}
            aria-live="polite"
          >
            {verdictText(good)}
          </div>
          <p className={styles.hudWhy}>{whyText(landed.sun, landed.earth)}</p>
          <SpotOutlook landed={landed} good={good} />
        </>
      ) : landed.status === 'checking' ? (
        <LoadingState label="Checking the sky here…" />
      ) : (
        <ErrorState message="Could not check this spot." onRetry={onRetry} />
      )}
      <div className={clsx(styles.hudRead, 'mono')}>
        <span>
          {fmtShort(landed.timeMs)}
          {landed.offsetMs ? ' (skipped ahead)' : ' (now)'}
        </span>
        {ok ? (
          <>
            <span>
              Sunlight:{' '}
              <i className="text-sun not-italic">{yesNo(landed.sun)}</i>
            </span>
            <span>
              Can see Earth:{' '}
              <u className="text-earth no-underline">{yesNo(landed.earth)}</u>
            </span>
          </>
        ) : null}
        <span>You are facing {facing}</span>
      </div>
      {dark ? (
        <p className={clsx(styles.hudNight, 'text-warn')}>
          It is dark here right now. Press &ldquo;Skip to sunrise&rdquo; to see
          daylight.
        </p>
      ) : null}
      <div className={styles.hudActs}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onBack}
          disabled={busy}
        >
          <span className="btn-label">Back to orbit</span>
        </button>
        {dark ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onSunrise}
            disabled={busy || sunriseBusy}
          >
            <span className="btn-label">
              {sunriseBusy ? 'Finding sunrise…' : 'Skip to sunrise'}
            </span>
          </button>
        ) : null}
        <button
          type="button"
          className="btn btn-accent btn-sm"
          onClick={onBestDates}
          disabled={busy}
        >
          <span className="btn-label">See the best dates</span>
        </button>
      </div>
      <p className={styles.hudNote}>
        Drag to look around. The Sun and Earth are drawn where the API puts them
        at this moment. The far skyline is the API&rsquo;s terrain horizon from
        NASA LOLA data; the near ground is only a drawing.
      </p>
    </div>
  );
}
