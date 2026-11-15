'use client';

import clsx from 'clsx';
import Link from 'next/link';

import { useSiteOutlook } from '@/lib/api/hooks';
import { fmtShort, plainDuration } from '@/lib/format/format';
import { sitePath } from '@/lib/routes';
import { outlookFrom } from '@/features/sites/lib/outlook';

import type { LandedState } from '../hooks/use-landing';
import styles from './landing.module.css';

/** How far ahead "Good again from" looks. */
const LOOK_AHEAD_DAYS = 30;
const TEN_MINUTES = 600_000;

/**
 * Under the landed verdict: when a spot that is not good now is next good, and for
 * how long (one POST /analyze), plus the link to the spot's own page.
 */
export function SpotOutlook({
  landed,
  good,
}: {
  landed: LandedState;
  good: boolean;
}) {
  const site = landed.siteId
    ? { id: landed.siteId }
    : { lat: landed.lat, lon: landed.lon };
  const startIso = new Date(
    Math.floor(landed.timeMs / TEN_MINUTES) * TEN_MINUTES,
  ).toISOString();
  const ask = landed.status === 'ok' && !good;
  const q = useSiteOutlook(ask ? site : null, startIso, LOOK_AHEAD_DAYS, false);
  const next = q.data ? outlookFrom(q.data, 1).next : null;

  return (
    <>
      {ask ? (
        <p
          className={clsx(styles.hudWhy, 'mt-2')}
          data-testid="next-good"
          aria-live="polite"
        >
          {q.isPending
            ? 'Looking for the next good time…'
            : q.isError
              ? 'Could not work out when it is next good.'
              : next
                ? `Good again from ${fmtShort(next.startMs)}, for ${next.openEnded ? 'at least ' : ''}${plainDuration(next.durationMs)}.`
                : `Not good at any time in the next ${LOOK_AHEAD_DAYS} days.`}
        </p>
      ) : null}
      <Link
        href={sitePath(landed.siteId, landed.lat, landed.lon)}
        className="btn btn-ghost btn-sm mt-3"
        data-testid="spot-page-link"
      >
        <span className="btn-label">See everything about this spot</span>
      </Link>
    </>
  );
}
