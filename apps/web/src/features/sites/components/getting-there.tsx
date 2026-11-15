'use client';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { errorMessage, type Schemas } from '@/lib/api/client';
import { useDepartures, useMissions, useSiteOutlook } from '@/lib/api/hooks';
import {
  fmtDate,
  fmtTravelDays,
  fmtUtc,
  plainDuration,
} from '@/lib/format/format';

import { hoursToMs, outlookFrom } from '../lib/outlook';
import { OUTLOOK_DAYS } from './landing-outlook';

type Mission = Schemas['Mission'];
type Departure = Schemas['Departure'];

/**
 * "Getting there": travel times of past landings from GET /missions, each with its source, and
 * when to leave Earth to land as the next good window opens (GET /missions/departures).
 */
export function GettingThere({
  siteId,
  site,
  nowIso,
}: {
  siteId: string | null;
  site: { id: string } | { lat: number; lon: number };
  nowIso: string;
}) {
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
      <LeaveEarthBy site={site} nowIso={nowIso} />
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

/**
 * The next good window comes from the same POST /analyze as "Is it a good landing site"
 * (same query key, so it is fetched once); the leave-Earth times come from the API.
 */
function LeaveEarthBy({
  site,
  nowIso,
}: {
  site: { id: string } | { lat: number; lon: number };
  nowIso: string;
}) {
  const outlook = useSiteOutlook(site, nowIso, OUTLOOK_DAYS, true);
  const next = outlook.data ? outlookFrom(outlook.data, 3).next : null;
  const arrivalIso = next ? new Date(next.startMs).toISOString() : null;
  const deps = useDepartures(arrivalIso);

  return (
    <div className="mt-8 border-t border-line pt-5" data-testid="leave-earth">
      <h3 className="text-[13px] font-bold tracking-[0.16em] text-faint uppercase">
        When to leave Earth
      </h3>
      <div className="mt-3">
        {outlook.isPending ? (
          <LoadingState label="Finding the next good window…" />
        ) : outlook.isError ? (
          <ErrorState
            message={errorMessage(outlook.error)}
            onRetry={() => void outlook.refetch()}
          />
        ) : !next ? (
          <EmptyState>
            There is no good window (Sun and Earth both in view) in the next{' '}
            {OUTLOOK_DAYS} days, so there is no landing time to plan back from.
          </EmptyState>
        ) : deps.isPending ? (
          <LoadingState label="Working out the departure times…" />
        ) : deps.isError ? (
          <ErrorState
            message={errorMessage(deps.error)}
            onRetry={() => void deps.refetch()}
          />
        ) : (
          <DepartureList
            arrivalIso={deps.data.arrival}
            departures={deps.data.departures}
            nowMs={Date.parse(nowIso)}
          />
        )}
      </div>
    </div>
  );
}

/** The leave-Earth times for one landing time, shortest trip first, as the API sent them. */
export function DepartureList({
  arrivalIso,
  departures,
  nowMs,
}: {
  arrivalIso: string;
  departures: Departure[];
  nowMs: number;
}) {
  if (departures.length === 0) {
    return (
      <EmptyState>
        No past mission has a known travel time to plan with.
      </EmptyState>
    );
  }
  return (
    <>
      <p className="text-[15px]">
        To land when the next good window opens on{' '}
        <b>{fmtUtc(Date.parse(arrivalIso))}</b>, leave Earth by:
      </p>
      <ul className="mt-3 grid gap-1.5 text-[14px]">
        {departures.map((d) => {
          const departMs = Date.parse(d.depart);
          return (
            <li
              key={d.mission_id}
              className="flex flex-wrap justify-between gap-x-4 border-b border-line py-1.5"
            >
              <span className="mono">
                {fmtUtc(departMs)}
                {departMs < nowMs ? (
                  <span className="text-warn"> (already past)</span>
                ) : null}
              </span>
              <span>
                {d.name}-style trip, {fmtTravelDays(d.travel_hours)}{' '}
                <Source url={d.source_url} />
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 max-w-[62ch] text-[13px] text-faint">
        Each line uses one past mission&apos;s time from launch to landing. A
        real mission&apos;s trip depends on its rocket, path and launch window.
      </p>
    </>
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
