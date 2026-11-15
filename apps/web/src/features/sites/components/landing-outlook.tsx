'use client';

import { ErrorState, LoadingState } from '@/components/ui/states';
import { errorMessage } from '@/lib/api/client';
import { useSiteOutlook } from '@/lib/api/hooks';
import { fmtPercent, fmtShort, plainDuration } from '@/lib/format/format';

import { hoursToMs, outlookFrom, type TimeWindow } from '../lib/outlook';

/** How far ahead the site page looks. */
export const OUTLOOK_DAYS = 30;

function lasts(w: TimeWindow, fromMs = w.startMs): string {
  const d = plainDuration(w.endMs - fromMs);
  return w.openEnded ? `at least ${d}` : d;
}

/** A spell length from the API's metrics; zero means there is none in the range. */
function spell(hours: number): string {
  return hours > 0 ? plainDuration(hoursToMs(hours)) : 'none';
}

/**
 * "Is it a good landing site, and for how long?": read from one POST /analyze over the
 * next 30 days. A good moment is one with both the Sun and the Earth in view, the same rule
 * as the globe's verdict (features/landing/lib/verdict.ts).
 */
export function LandingOutlook({
  site,
  nowIso,
}: {
  site: { id: string } | { lat: number; lon: number };
  nowIso: string;
}) {
  const q = useSiteOutlook(site, nowIso, OUTLOOK_DAYS, true);

  return (
    <section
      className="panel p-6 md:p-8"
      aria-labelledby="good-h"
      data-testid="landing-outlook"
    >
      <p className="eyebrow">The next {OUTLOOK_DAYS} days</p>
      <h2 id="good-h" className="mt-3 font-display text-2xl font-light">
        Is it a good landing site, and for how long?
      </h2>
      <p className="mt-2 max-w-[62ch] text-[14px] text-faint">
        Good means the Sun is in view for solar power and the Earth is in view
        to radio home, both above the real terrain.
      </p>
      <div className="mt-6">
        {q.isPending ? (
          <LoadingState label="Working out the next 30 days…" />
        ) : q.isError ? (
          <ErrorState
            message={errorMessage(q.error)}
            onRetry={() => void q.refetch()}
          />
        ) : (
          <OutlookBody result={q.data} nowIso={nowIso} />
        )}
      </div>
    </section>
  );
}

function OutlookBody({
  result,
  nowIso,
}: {
  result: Parameters<typeof outlookFrom>[0];
  nowIso: string;
}) {
  const o = outlookFrom(result, 3);
  const nowMs = Date.parse(nowIso);
  const m = result.metrics;
  const { sun_visible: sun, earth_visible: earth } = result.at_start;
  const missing =
    !sun && !earth
      ? 'the Sun and the Earth are both out of view'
      : !sun
        ? 'the Sun is out of view'
        : 'the Earth is out of view';

  return (
    <div className="grid gap-6">
      <div
        className="rounded-2xl border border-line p-5"
        data-testid="outlook-headline"
        data-good={o.goodNow ? 'yes' : 'no'}
      >
        {o.goodNow && o.current ? (
          <>
            <p className="font-display text-2xl text-ok">Good right now</p>
            <p className="mt-2">
              It stays good until <b>{fmtShort(o.current.endMs)}</b>, so for{' '}
              <b>{lasts(o.current, nowMs)}</b> from now.
            </p>
          </>
        ) : (
          <>
            <p className="font-display text-2xl text-warn">
              Not good right now
            </p>
            <p className="mt-2">Right now {missing}.</p>
            {o.next ? (
              <p className="mt-1">
                It is next good from <b>{fmtShort(o.next.startMs)}</b>, for{' '}
                <b>{lasts(o.next)}</b>.
              </p>
            ) : (
              <p className="mt-1">
                There is no time in the next {OUTLOOK_DAYS} days with both the
                Sun and the Earth in view.
              </p>
            )}
          </>
        )}
      </div>

      <div>
        <h3 className="text-[13px] font-bold tracking-[0.16em] text-faint uppercase">
          Next good windows
        </h3>
        {o.upcoming.length === 0 ? (
          <p className="mt-2 text-[15px] text-faint">
            No other good window in the next {OUTLOOK_DAYS} days.
          </p>
        ) : (
          <ol className="mt-3 grid gap-2 md:grid-cols-3">
            {o.upcoming.map((w) => (
              <li
                key={w.startMs}
                className="rounded-xl border border-line px-4 py-3 text-[14px]"
              >
                <span className="block">From {fmtShort(w.startMs)}</span>
                <span className="mono block text-faint">lasts {lasts(w)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div>
        <h3 className="text-[13px] font-bold tracking-[0.16em] text-faint uppercase">
          Can a lander stay, or must it leave?
        </h3>
        <ul className="mt-3 grid gap-2 text-[15px]">
          <li>
            {sun ? (
              m.next_sunset ? (
                <>
                  Sunlight lasts until{' '}
                  <b>{fmtShort(Date.parse(m.next_sunset))}</b> (next sunset).
                </>
              ) : (
                <>The Sun stays in view for the whole {OUTLOOK_DAYS} days.</>
              )
            ) : m.next_sunrise ? (
              <>
                It is dark now. The Sun next rises over the terrain at{' '}
                <b>{fmtShort(Date.parse(m.next_sunrise))}</b>.
              </>
            ) : (
              <>The Sun stays out of view for the whole {OUTLOOK_DAYS} days.</>
            )}
          </li>
          <li>
            {earth ? (
              m.next_earthset ? (
                <>
                  Direct radio contact with Earth lasts until{' '}
                  <b>{fmtShort(Date.parse(m.next_earthset))}</b> (next
                  Earthset).
                </>
              ) : (
                <>The Earth stays in view for the whole {OUTLOOK_DAYS} days.</>
              )
            ) : m.next_earthrise ? (
              <>
                The Earth is hidden now. It next rises over the terrain at{' '}
                <b>{fmtShort(Date.parse(m.next_earthrise))}</b>.
              </>
            ) : (
              <>
                The Earth stays out of view for the whole {OUTLOOK_DAYS} days.
              </>
            )}
          </li>
          <li>
            The longest dark spell a lander would have to live through is{' '}
            <b>{spell(m.longest_dark_hours)}</b>.
          </li>
          <li>
            The longest time without the Earth in view (no direct radio) is{' '}
            <b>{spell(m.longest_comm_gap_hours)}</b>.
          </li>
          <li>
            Over the {OUTLOOK_DAYS} days: sunlight{' '}
            <b>{fmtPercent(m.sunlight_fraction)}</b> of the time, Earth in view{' '}
            <b>{fmtPercent(m.earth_visible_fraction)}</b>, both{' '}
            <b>{fmtPercent(m.both_fraction)}</b>.
          </li>
        </ul>
        <p className="mt-3 max-w-[62ch] text-[13px] text-faint">
          Whether a lander can stay depends on its batteries, heaters and
          radios. Compare these times with what your lander can survive.
        </p>
      </div>
    </div>
  );
}
