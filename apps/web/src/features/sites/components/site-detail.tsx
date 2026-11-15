'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useToast } from '@/components/ui/toast';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { errorMessage, type Site } from '@/lib/api/client';
import { useSites } from '@/lib/api/hooks';
import { fmtCoord, fmtDate } from '@/lib/format/format';
import { plannerPath } from '@/lib/routes';
import { SiteAssistant } from '@/features/site-assistant/components/site-assistant';
import { spotLabel } from '@/features/landing/lib/verdict';

import { isValidPoint, kindLabel } from '../lib/kinds';
import { GettingThere } from './getting-there';
import { LandingOutlook } from './landing-outlook';
import { RightNow } from './right-now';
import { SkyForecast } from './sky-forecast';
import { TerrainMap } from './terrain-map';

type Props = { siteId: string } | { lat: number; lon: number };

/** Ten minutes: "now" on this page is rounded so every panel asks about the same moment. */
const NOW_STEP_MS = 600_000;

/** The site page: everything about one curated site or one chosen spot. Every number is the API's. */
export function SiteDetail(props: Props) {
  const sites = useSites();
  const [nowMs] = useState(
    () => Math.floor(Date.now() / NOW_STEP_MS) * NOW_STEP_MS,
  );

  if ('siteId' in props) {
    if (sites.isPending) {
      return (
        <Shell>
          <LoadingState label="Loading the site…" />
        </Shell>
      );
    }
    if (sites.isError) {
      return (
        <Shell>
          <ErrorState
            message={errorMessage(sites.error)}
            onRetry={() => void sites.refetch()}
          />
        </Shell>
      );
    }
    const site = sites.data.find((s) => s.id === props.siteId);
    if (!site) return <SiteNotFound />;
    return <SiteBody site={site} siteId={site.id} nowMs={nowMs} />;
  }

  if (!isValidPoint(props.lat, props.lon)) return <SiteNotFound spot />;
  const lon = props.lon > 180 ? props.lon - 360 : props.lon;
  const spot: Site = {
    id: 'spot',
    kind: 'custom',
    name: spotLabel(props.lat, lon),
    lat: props.lat,
    lon,
    description:
      'A point you chose on the globe. The terrain and the sky are worked out for this exact spot.',
  };
  return <SiteBody site={spot} siteId={null} nowMs={nowMs} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="section pt-36">
      <div className="wrap">{children}</div>
    </section>
  );
}

export function SiteNotFound({ spot = false }: { spot?: boolean }) {
  return (
    <Shell>
      <div role="alert" className="panel max-w-2xl p-8">
        <p className="eyebrow">Not found</p>
        <h1 className="mt-4 font-display text-4xl font-light">
          {spot
            ? 'This spot is not on the Moon map'
            : 'We do not know this site'}
        </h1>
        <p className="lead">
          {spot
            ? 'The link needs a latitude from -90 to 90 and a longitude from -180 to 360.'
            : 'The link may be old or mistyped. Pick a site from the list, or choose any spot on the globe.'}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/sites" className="btn btn-accent btn-sm">
            <span className="btn-label">See all sites</span>
          </Link>
          <Link href="/explore" className="btn btn-ghost btn-sm">
            <span className="btn-label">Choose a spot on the globe</span>
          </Link>
        </div>
      </div>
    </Shell>
  );
}

function SiteBody({
  site,
  siteId,
  nowMs,
}: {
  site: Site;
  siteId: string | null;
  nowMs: number;
}) {
  const nowIso = new Date(nowMs).toISOString();
  const ref = siteId ? { id: siteId } : { lat: site.lat, lon: site.lon };
  const point = { lat: site.lat, lon: site.lon };

  return (
    <>
      <SiteHeader site={site} siteId={siteId} nowMs={nowMs} />
      <div className="wrap grid gap-6 pb-24">
        <RightNow point={point} nowIso={nowIso} />
        <LandingOutlook site={ref} nowIso={nowIso} />
        <SkyForecast site={ref} nowIso={nowIso} />
        <TerrainMap point={point} />
        <GettingThere siteId={siteId} site={ref} nowIso={nowIso} />
        <section className="panel p-6 md:p-8" aria-labelledby="sure-h">
          <p className="eyebrow">How sure are we</p>
          <h2 id="sure-h" className="mt-3 font-display text-2xl font-light">
            How far can you trust these numbers?
          </h2>
          <p className="mt-3 max-w-[60ch] text-muted">
            We check our Sun and Earth positions against NASA JPL Horizons and
            against past landings. The accuracy page shows the error rates.
          </p>
          <Link href="/accuracy" className="btn btn-ghost btn-sm mt-5">
            <span className="btn-label">See the accuracy page</span>
          </Link>
        </section>
        <section aria-label="Ask about this site">
          <SiteAssistant
            siteId={siteId}
            lat={site.lat}
            lon={site.lon}
            name={site.name}
            timeIso={nowIso}
          />
        </section>
      </div>
    </>
  );
}

function SiteHeader({
  site,
  siteId,
  nowMs,
}: {
  site: Site;
  siteId: string | null;
  nowMs: number;
}) {
  const toast = useToast((s) => s.show);
  const place = siteId
    ? ({ kind: 'site', id: siteId } as const)
    : ({ kind: 'point', lat: site.lat, lon: site.lon } as const);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast('Link copied.');
    } catch {
      toast('Could not copy the link. Copy it from the address bar.');
    }
  };

  return (
    <header className="section pt-36 pb-10">
      <div className="wrap">
        <nav aria-label="Breadcrumb" className="mb-6 text-[13px] text-faint">
          <Link href="/sites" className="underline underline-offset-[3px]">
            All sites
          </Link>
          <span aria-hidden="true"> / </span>
          <span>{site.name}</span>
        </nav>
        <p className="eyebrow">{kindLabel(site.kind)}</p>
        <h1
          className="h2 mt-4"
          data-testid="site-title"
          style={{ fontSize: 'clamp(36px, 5vw, 72px)' }}
        >
          {site.name}
        </h1>
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[14px]">
          <div>
            <dt className="inline text-faint">Coordinates: </dt>
            <dd className="mono inline">{fmtCoord(site.lat, site.lon)}</dd>
          </div>
          {site.mission_date ? (
            <div>
              <dt className="inline text-faint">Mission date: </dt>
              <dd className="inline">
                {fmtDate(Date.parse(site.mission_date))}
              </dd>
            </div>
          ) : null}
        </dl>
        <p className="lead">{site.description}</p>
        {site.source_url ? (
          <p className="mt-3 text-[13px]">
            <a
              href={site.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-2 underline underline-offset-[3px]"
            >
              Source for this site
            </a>
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={plannerPath(place, nowMs)}
            className="btn btn-accent btn-sm"
          >
            <span className="btn-label">Open in planner</span>
          </Link>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => void copy()}
          >
            <span className="btn-label">Copy link</span>
          </button>
        </div>
      </div>
    </header>
  );
}
