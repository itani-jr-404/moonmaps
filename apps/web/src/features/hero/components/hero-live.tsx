'use client';

import type { SkyResponse } from '@/lib/api/client';

import { useClock } from '../hooks/use-clock';
import styles from './hero.module.css';

export interface HeroLiveSky {
  data: SkyResponse | undefined;
  isPending: boolean;
  isError: boolean;
}

function skyText(sky: HeroLiveSky, pick: (d: SkyResponse) => string): string {
  if (sky.isError) return 'Unavailable';
  if (sky.isPending || !sky.data) return '--';
  return pick(sky.data);
}

/**
 * The hero's live block: whether the Sun is up and the Earth is in view at the
 * south pole right now (from the API's /sky answer), and the visitor's clock.
 */
export function HeroLive({ sky }: { sky: HeroLiveSky }) {
  const now = useClock();
  const sun = skyText(sky, (d) =>
    d.sun.visible ? 'Yes, the Sun is up' : 'No, it is dark',
  );
  const earth = skyText(sky, (d) => (d.earth.visible ? 'In view' : 'Hidden'));
  const clock =
    now === null
      ? '--'
      : new Date(now).toLocaleString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

  return (
    <div className={styles.meta} data-hero-fade>
      <div aria-live="polite">
        <b>Right now at the south pole</b>
        <span>
          Sunlight:{' '}
          <em className={`${styles.sunValue} font-mono`} data-testid="live-sun">
            {sun}
          </em>
        </span>
        <span>
          Earth:{' '}
          <em
            className={`${styles.earthValue} font-mono`}
            data-testid="live-earth"
          >
            {earth}
          </em>
        </span>
      </div>
      <div>
        <b>Your time</b>
        <span className={`${styles.clock} font-mono`}>{clock}</span>
        <span className={styles.note}>Updated every second</span>
      </div>
    </div>
  );
}
