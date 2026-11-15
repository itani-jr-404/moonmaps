'use client';

import { ErrorState, LoadingState } from '@/components/ui/states';
import { errorMessage, type Schemas } from '@/lib/api/client';
import { useMissions } from '@/lib/api/hooks';
import { fmtDate, plainDuration } from '@/lib/format/format';

import { hoursToMs } from '../lib/outlook';

type Mission = Schemas['Mission'];

/** "Getting there": travel times of past landings from GET /missions, each with its source. */
export function GettingThere({ siteId }: { siteId: string | null }) {
  const q = useMissions();

  return (
    <section
      className="panel p-6 md:p-8"
      aria-labelledby="travel-h"
      data-testid="getting-there"
    >
      <p className="eyebrow">Getting there</p>
      <h2 id="travel-h" className="mt-3 font-display text-2xl font-light">
        How long does the trip from Earth take?
      </h2>
      <div className="mt-6">
        {q.isPending ? (
          <LoadingState label="Loading past missions…" />
        ) : q.isError ? (
          <ErrorState
            message={errorMessage(q.error)}
            onRetry={() => void q.refetch()}
          />
        ) : q.data.missions.length === 0 ? (
          <p className="text-[15px] text-faint">
            No past missions are listed yet.
          </p>
        ) : (
          <TravelBody missions={q.data.missions} siteId={siteId} />
        )}
      </div>
    </section>
  );
}

function TravelBody({
  missions,
  siteId,
}: {
  missions: Mission[];
  siteId: string | null;
}) {
  const here = siteId ? missions.find((m) => m.site_id === siteId) : undefined;
  const timed = missions
    .filter((m) => m.travel_hours !== null)
    .sort((a, b) => a.travel_hours! - b.travel_hours!);
  const fastest = timed[0];
  const slowest = timed[timed.length - 1];

  return (
    <div className="grid gap-5">
      {here ? (
        <div
          className="rounded-2xl border border-line p-5"
          data-testid="mission-here"
        >
          <p className="font-display text-xl">{here.name} landed here</p>
          <p className="mt-2 text-[15px]">
            Launched {fmtDate(Date.parse(here.launch))}
            {here.landing
              ? `, landed ${fmtDate(Date.parse(here.landing))}`
              : ''}
            {here.travel_hours !== null ? (
              <>
                : the trip took{' '}
                <b>{plainDuration(hoursToMs(here.travel_hours))}</b>.
              </>
            ) : (
              '.'
            )}{' '}
            <Source url={here.source_url} />
          </p>
        </div>
      ) : null}
      {fastest && slowest ? (
        <p className="text-[15px]">
          Past landings took from{' '}
          <b>{plainDuration(hoursToMs(fastest.travel_hours!))}</b> (
          {fastest.name}) to{' '}
          <b>{plainDuration(hoursToMs(slowest.travel_hours!))}</b> (
          {slowest.name}) between launch and touchdown.
        </p>
      ) : null}
      <ul className="grid gap-1.5 text-[14px]">
        {timed.map((m) => (
          <li
            key={m.id}
            className="flex flex-wrap justify-between gap-x-4 border-b border-line py-1.5"
          >
            <span>
              {m.name}{' '}
              <span className="text-faint">
                ({fmtDate(Date.parse(m.launch))})
              </span>
            </span>
            <span className="mono">
              {plainDuration(hoursToMs(m.travel_hours!))}{' '}
              <Source url={m.source_url} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Source({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[12px] text-accent-2 underline underline-offset-[3px]"
    >
      source
    </a>
  );
}
