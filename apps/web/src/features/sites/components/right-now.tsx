'use client';

import { clsx } from 'clsx';

import { ErrorState, LoadingState } from '@/components/ui/states';
import { errorMessage, type SkyResponse } from '@/lib/api/client';
import { useScene, useSky } from '@/lib/api/hooks';
import { compassWord, fmtDeg, fmtKm, fmtShort } from '@/lib/format/format';

/**
 * "Right now": the Sun and the Earth over this site (GET /sky), the distance from this site to
 * the Earth's surface (GET /sky) and the centre-to-centre Earth–Moon distance (GET /scene).
 */
export function RightNow({
  point,
  nowIso,
}: {
  point: { lat: number; lon: number };
  nowIso: string;
}) {
  const sky = useSky(point, nowIso);
  const scene = useScene(nowIso);

  return (
    <section
      className="panel p-6 md:p-8"
      aria-labelledby="now-h"
      data-testid="right-now"
    >
      <p className="eyebrow">Right now</p>
      <h2 id="now-h" className="mt-3 font-display text-2xl font-light">
        What the sky looks like here
      </h2>
      <p className="mt-2 text-[13px] text-faint">
        At {fmtShort(Date.parse(nowIso))}, your local time.
      </p>
      <div className="mt-6">
        {sky.isPending ? (
          <LoadingState label="Checking the sky here…" />
        ) : sky.isError ? (
          <ErrorState
            message={errorMessage(sky.error)}
            onRetry={() => void sky.refetch()}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <BodyCard name="Sun" tone="sun" body={sky.data.sun} />
            <BodyCard name="Earth" tone="earth" body={sky.data.earth} />
          </div>
        )}
      </div>
      <div className="mt-6 border-t border-line pt-5">
        <h3 className="text-[13px] font-bold tracking-[0.16em] text-faint uppercase">
          How far away is the Earth?
        </h3>
        <dl className="mt-3 grid gap-4 text-[14px]">
          <DistanceRow
            label="From this site to the nearest point on Earth's surface"
            note="From this spot at the Moon's reference radius (local hills not counted) to the closest point of the Earth, taken as a ball of its equatorial radius."
            testId="earth-surface-distance"
            query={{
              isPending: sky.isPending,
              isError: sky.isError,
              km: sky.data?.earth_surface_distance_km,
              retry: () => void sky.refetch(),
            }}
          />
          <DistanceRow
            label="Centre of the Earth to centre of the Moon"
            note="The usual Earth–Moon distance, between the centres of the two bodies. It is the same for every site."
            testId="earth-distance"
            query={{
              isPending: scene.isPending,
              isError: scene.isError,
              km: scene.data?.earth_distance_km,
              retry: () => void scene.refetch(),
            }}
          />
        </dl>
      </div>
    </section>
  );
}

function BodyCard({
  name,
  tone,
  body,
}: {
  name: string;
  tone: 'sun' | 'earth';
  body: SkyResponse['sun'];
}) {
  const color = tone === 'sun' ? 'text-sun' : 'text-earth';
  return (
    <div className="rounded-2xl border border-line p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className={clsx('font-display text-xl', color)}>{name}</h3>
        <b className={body.visible ? 'text-ok' : 'text-warn'}>
          {body.visible ? 'In view' : 'Not in view'}
        </b>
      </div>
      <dl className="mono mt-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-[13px]">
        <dt className="text-faint">Elevation</dt>
        <dd>{fmtDeg(body.el)}</dd>
        <dt className="text-faint">Azimuth (from north)</dt>
        <dd>
          {body.az.toFixed(1)}° ({compassWord(body.az)})
        </dd>
        <dt className="text-faint">Terrain horizon in that direction</dt>
        <dd>{fmtDeg(body.horizon_el)}</dd>
        <dt className="text-faint">Above the terrain by</dt>
        <dd>{fmtDeg(body.clearance)}</dd>
      </dl>
    </div>
  );
}

/** One labelled distance with its one-line meaning; loading and error states included. */
export function DistanceRow({
  label,
  note,
  testId,
  query,
}: {
  label: string;
  note: string;
  testId: string;
  query: {
    isPending: boolean;
    isError: boolean;
    km: number | undefined;
    retry: () => void;
  };
}) {
  return (
    <div>
      <dt className="text-faint">{label}</dt>
      <dd className="mt-0.5">
        {query.isPending ? (
          <span className="text-faint">loading…</span>
        ) : query.isError || query.km === undefined ? (
          <span className="text-warn">
            could not load.{' '}
            <button type="button" className="underline" onClick={query.retry}>
              Try again
            </button>
          </span>
        ) : (
          <b className="mono" data-testid={testId}>
            {fmtKm(query.km)}
          </b>
        )}
        <span className="mt-0.5 block text-[13px] text-faint">{note}</span>
      </dd>
    </div>
  );
}
