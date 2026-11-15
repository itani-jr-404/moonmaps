'use client';

import clsx from 'clsx';
import { useRef } from 'react';

import { ErrorState, LoadingState } from '@/components/ui/states';
import { useSites } from '@/lib/api/hooks';

import { useLanding } from '../hooks/use-landing';
import { isGood } from '../lib/verdict';
import { AimCard } from './aim-card';
import styles from './landing.module.css';
import { SurfaceHud } from './surface-hud';

type Mood = 'good' | 'bad' | undefined;

function mood(ok: boolean, sun: boolean, earth: boolean): Mood {
  if (!ok) return undefined;
  return isGood(sun, earth) ? 'good' : 'bad';
}

/** "Choose your landing": aim at the Moon, read the API's verdict, land and look around. */
export function LandingSection() {
  const sites = useSites();
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lzRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const l = useLanding({ stageRef, canvasRef, lzRef, flashRef }, sites.data);
  const onSurface = l.view === 'surface' && l.landed !== null;
  const stageMood: Mood = onSurface
    ? mood(
        l.landed?.status === 'ok',
        l.landed?.sun ?? false,
        l.landed?.earth ?? false,
      )
    : l.view === 'orbit'
      ? mood(l.aim?.status === 'ok', l.aim?.sun ?? false, l.aim?.earth ?? false)
      : undefined;

  return (
    <section className={styles.land} id="land" aria-labelledby="land-h">
      <div className={clsx('wrap', styles.head)}>
        <p className="eyebrow" data-reveal>
          Choose your landing
        </p>
        <h1 className="h2" id="land-h" data-lines>
          <span className="line">
            <span className="li">Where will you</span>
          </span>
          <span className="line">
            <span className="li">
              <em>touch down?</em>
            </span>
          </span>
        </h1>
        <p className="lead" data-reveal>
          The south polar region is turned toward you. Point at any spot. A red
          arrow shows where you would land and tells you if it is a good landing
          site right now. Click to land and look around.
        </p>
      </div>
      <div
        ref={stageRef}
        className={styles.stage}
        data-cursor="land"
        data-mood={stageMood}
        data-landed={onSurface ? '' : undefined}
      >
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          aria-label="Interactive 3D Moon. Hover to aim at a landing site, click to choose it."
        />
        <div ref={lzRef} className={styles.lz} aria-hidden="true">
          {l.aim ? <AimCard aim={l.aim} /> : null}
        </div>
        {l.status === 'ready' ? (
          <p className={clsx(styles.hint, 'text-faint')}>
            Drag to turn the Moon in any direction. Click to land.
          </p>
        ) : null}
        <div className={styles.shade} aria-hidden="true" />
        <div ref={flashRef} className={styles.flash} aria-hidden="true" />
        {onSurface && l.landed ? (
          <SurfaceHud
            landed={l.landed}
            facing={l.facing}
            busy={l.busy}
            sunriseBusy={l.sunriseBusy}
            onBack={l.backToOrbit}
            onSunrise={l.skipToSunrise}
            onBestDates={l.showBestDates}
            onRetry={l.retrySky}
          />
        ) : null}
        {l.status === 'loading' ? (
          <div className={styles.overlay}>
            <LoadingState label="Loading the Moon…" />
          </div>
        ) : null}
        {l.status === 'unsupported' ? (
          <div className={styles.overlay}>
            <ErrorState message="Your browser cannot show the 3D Moon." />
          </div>
        ) : null}
      </div>
    </section>
  );
}
