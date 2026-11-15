'use client';

import Link from 'next/link';
import { useState } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { errorMessage, type Site } from '@/lib/api/client';
import { useSites, useSky } from '@/lib/api/hooks';
import { fmtCoord, fmtDate } from '@/lib/format/format';
import { sitePath } from '@/lib/routes';

import { groupByKind } from '../lib/kinds';

/** All curated sites from GET /sites, grouped by kind, each with a light "right now" line. */
export function SitesIndex() {
  const sites = useSites();
  // One moment for every card, rounded to ten minutes so the sky answers are cached.
  const [nowIso] = useState(() =>
    new Date(Math.floor(Date.now() / 600_000) * 600_000).toISOString(),
  );

  return (
    <section className="section pt-36" aria-labelledby="sites-h">
      <div className="wrap">
        <p className="eyebrow">Sites</p>
        <h1 id="sites-h" className="h2" data-lines>
          <span className="line">
            <span className="li">Every site</span>
          </span>
          <span className="line">
            <span className="li">
              <em>in one place.</em>
            </span>
          </span>
        </h1>
        <p className="lead">
          Past landings, candidate sites and reference points. Open a site to
          see its sky right now, when it is good for landing and for how long,
          and a day-by-day forecast.
        </p>
        <div className="mt-12">
          {sites.isPending ? (
            <LoadingState label="Loading the sites…" />
          ) : sites.isError ? (
            <ErrorState
              message={errorMessage(sites.error)}
              onRetry={() => void sites.refetch()}
            />
          ) : sites.data.length === 0 ? (
            <EmptyState>No sites are listed yet.</EmptyState>
          ) : (
            <div className="grid gap-12">
              {groupByKind(sites.data).map((g) => (
                <section key={g.kind} aria-labelledby={`kind-${g.kind}`}>
                  <h2
                    id={`kind-${g.kind}`}
                    className="font-display text-2xl font-light"
                  >
                    {g.label}
                  </h2>
                  <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {g.sites.map((s) => (
                      <li key={s.id}>
                        <SiteCard site={s} nowIso={nowIso} />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SiteCard({ site, nowIso }: { site: Site; nowIso: string }) {
  return (
    <Link
      href={sitePath(site.id, site.lat, site.lon)}
      className="panel block h-full p-5 transition-colors hover:border-line-2 focus-visible:border-accent-2"
      data-testid="site-card"
    >
      <b className="block font-display text-xl font-normal">{site.name}</b>
      <span className="mono mt-1 block text-[12px] text-faint">
        {fmtCoord(site.lat, site.lon, 2)}
        {site.mission_date
          ? ` · ${fmtDate(Date.parse(site.mission_date))}`
          : ''}
      </span>
      <span className="mt-3 line-clamp-2 block text-[14px] text-muted">
        {site.description}
      </span>
      <CardSky site={site} nowIso={nowIso} />
    </Link>
  );
}

/** One GET /sky per card: is the Sun and the Earth in view at this site right now. */
function CardSky({ site, nowIso }: { site: Site; nowIso: string }) {
  const sky = useSky({ lat: site.lat, lon: site.lon }, nowIso);
  if (sky.isPending)
    return (
      <span className="mt-4 block text-[12px] text-faint">
        Checking the sky…
      </span>
    );
  if (sky.isError)
    return (
      <span className="mt-4 block text-[12px] text-faint">
        Sky not available right now.
      </span>
    );
  const { sun, earth } = sky.data;
  const good = sun.visible && earth.visible;
  return (
    <span className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
      <b className={good ? 'text-ok' : 'text-warn'}>
        {good ? 'Good right now' : 'Not good right now'}
      </b>
      <span className="text-sun">Sun {sun.visible ? 'in view' : 'hidden'}</span>
      <span className="text-earth">
        Earth {earth.visible ? 'in view' : 'hidden'}
      </span>
    </span>
  );
}
