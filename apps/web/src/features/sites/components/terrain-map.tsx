'use client';

import { useEffect, useRef } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { ApiError, errorMessage, type TerrainTile } from '@/lib/api/client';
import { useTerrain } from '@/lib/api/hooks';

import {
  SHADE_EXAGGERATION,
  gridName,
  rampGradient,
  reliefPixels,
  scaleBarKm,
} from '../lib/relief';

/** Half the width of the map, in km. */
const RADIUS_KM = 30;

const fmtM = (m: number) => `${Math.round(m).toLocaleString('en-US')} m`;

/**
 * "The ground": a shaded elevation map of the square around the site (GET /terrain).
 * The picture is drawn once on a canvas; nothing moves, so reduced motion needs no change.
 */
export function TerrainMap({ point }: { point: { lat: number; lon: number } }) {
  const terrain = useTerrain(point, RADIUS_KM);
  const noTerrain =
    terrain.error instanceof ApiError && terrain.error.status === 404;

  return (
    <section
      className="panel p-6 md:p-8"
      aria-labelledby="ground-h"
      data-testid="terrain-map"
    >
      <p className="eyebrow">The ground</p>
      <h2 id="ground-h" className="mt-3 font-display text-2xl font-light">
        Elevation around this site
      </h2>
      <p className="mt-2 max-w-[60ch] text-[13px] text-faint">
        Heights of the ground {RADIUS_KM * 2} km across, from NASA&apos;s Lunar
        Orbiter Laser Altimeter (LOLA). These are the same elevation maps the
        terrain horizon is computed from.
      </p>
      <div className="mt-6">
        {terrain.isPending ? (
          <LoadingState label="Loading the elevation map…" />
        ) : noTerrain ? (
          <EmptyState>
            No elevation map is loaded for this place, so the ground cannot be
            shown. The horizon here is a smooth Moon.
          </EmptyState>
        ) : terrain.isError ? (
          <ErrorState
            message={errorMessage(terrain.error)}
            onRetry={() => void terrain.refetch()}
          />
        ) : (
          <ReliefView tile={terrain.data} />
        )}
      </div>
    </section>
  );
}

function ReliefView({ tile }: { tile: TerrainTile }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const n = tile.n;
  const widthKm = (n * tile.spacing_m) / 1000;
  const barKm = scaleBarKm(widthKm);

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const pixels = reliefPixels(
      tile.heights_m,
      tile.spacing_m,
      tile.min_m,
      tile.max_m,
    );
    const image = ctx.createImageData(n, n);
    image.data.set(pixels);
    ctx.putImageData(image, 0, 0);
  }, [tile, n]);

  const summary = `Elevation map, ${Math.round(widthKm)} km across, north up. Lowest ${fmtM(tile.min_m)}, highest ${fmtM(tile.max_m)}, at the site ${fmtM(tile.centre_m)}, relative to a sphere of radius ${tile.reference_radius_km} km.`;

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,420px)_1fr]">
      <figure className="m-0">
        <div className="relative overflow-hidden rounded-2xl border border-line">
          <canvas
            ref={canvas}
            width={n}
            height={n}
            role="img"
            aria-label={summary}
            className="block aspect-square w-full"
          />
          {/* The site, at the centre sample. */}
          <span
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-accent"
          />
          <span
            aria-hidden="true"
            className="absolute top-3 right-3 flex flex-col items-center rounded-lg bg-bg/70 px-2 py-1 text-[12px] font-semibold text-ink"
          >
            <svg viewBox="0 0 12 14" className="h-3.5 w-3" aria-hidden="true">
              <path d="M6 0 L12 14 L6 10 L0 14 Z" fill="currentColor" />
            </svg>
            N
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3 text-[12px] text-faint">
          <span
            aria-hidden="true"
            className="block h-1.5 border-x border-b border-ink"
            style={{ width: `${(barKm / widthKm) * 100}%` }}
          />
          <span>{barKm} km</span>
        </div>
      </figure>
      <div>
        <p className="text-[13px] text-faint">
          Height above the reference sphere
        </p>
        <div
          aria-hidden="true"
          className="mt-2 h-3 rounded-full"
          style={{ background: rampGradient() }}
        />
        <div className="mono mt-1 flex justify-between text-[12px] text-faint">
          <span>{fmtM(tile.min_m)}</span>
          <span>{fmtM((tile.min_m + tile.max_m) / 2)}</span>
          <span>{fmtM(tile.max_m)}</span>
        </div>
        <dl className="mono mt-5 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-[13px]">
          <dt className="text-faint">Lowest</dt>
          <dd>{fmtM(tile.min_m)}</dd>
          <dt className="text-faint">Highest</dt>
          <dd>{fmtM(tile.max_m)}</dd>
          <dt className="text-faint">At the site (centre dot)</dt>
          <dd>{fmtM(tile.centre_m)}</dd>
        </dl>
        <p className="mt-5 text-[13px] text-faint">
          Heights are metres above a sphere of radius {tile.reference_radius_km}{' '}
          km, the reference of the LOLA maps. Data:{' '}
          {gridName(tile.source, tile.resolution_m)}. Shading uses a light from
          the north-west with heights exaggerated {SHADE_EXAGGERATION} times,
          only to show the shape of the ground; it is not the Sun.
        </p>
      </div>
    </div>
  );
}
