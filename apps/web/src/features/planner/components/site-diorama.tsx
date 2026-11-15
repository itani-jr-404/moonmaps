'use client';

import { useEffect, useMemo, useRef } from 'react';

import { errorMessage } from '@/lib/api/client';
import { useSites, useSky } from '@/lib/api/hooks';
import { useReducedMotion } from '@/lib/motion/reduced-motion';
import { useScenarioStore } from '@/lib/state/scenario-store';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { horizonText } from '../lib/horizon-text';
import { createDioramaScene, type DioramaScene } from '../lib/diorama-scene';

/** "See the spot in 3D": the ground around the place with beams toward the Sun and the Earth from /sky. */
export function SiteDiorama() {
  const place = useScenarioStore((s) => s.place);
  const timeMs = useScenarioStore((s) => s.timeMs);
  const sites = useSites();
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<DioramaScene | null>(null);

  const site =
    place.kind === 'site'
      ? sites.data?.find((s) => s.id === place.id)
      : undefined;
  const lat = place.kind === 'point' ? place.lat : site?.lat;
  const lon = place.kind === 'point' ? place.lon : site?.lon;
  const point = useMemo(
    () => (lat !== undefined && lon !== undefined ? { lat, lon } : null),
    [lat, lon],
  );
  const sky = useSky(point, new Date(timeMs).toISOString());

  // The scene lives as long as the canvas; the effects below feed it.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const s = createDioramaScene(canvas, { reducedMotion: false });
    sceneRef.current = s;
    return () => {
      sceneRef.current = null;
      s.dispose();
    };
  }, []);

  useEffect(() => {
    sceneRef.current?.setReducedMotion(reduced);
  }, [reduced]);

  useEffect(() => {
    if (point) sceneRef.current?.setSite(point.lat, point.lon);
  }, [point]);

  const data = sky.data;
  useEffect(() => {
    sceneRef.current?.setSky(
      data
        ? {
            sun: {
              az: data.sun.az,
              el: data.sun.el,
              visible: data.sun.visible,
            },
            earth: {
              az: data.earth.az,
              el: data.earth.el,
              visible: data.earth.visible,
            },
          }
        : null,
    );
  }, [data]);

  return (
    <div className="panel min-w-0" data-reveal>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-[18px]">
        <span className="text-[11px] font-bold tracking-[.24em] text-accent uppercase">
          See the spot in 3D
        </span>
        <span className="text-xs leading-normal text-faint">
          Drag to turn, scroll to zoom
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="block h-[360px] w-full cursor-grab touch-pan-y"
        data-cursor="drag"
        data-lenis-prevent=""
        aria-label="3D view of the ground around the landing place, with the directions of the Sun and Earth"
      />
      <div className="flex flex-wrap gap-x-5 gap-y-2 px-6 pt-3 pb-4 text-xs text-faint">
        <span className="inline-flex items-center gap-2">
          <i className="block h-[3px] w-4 rounded-sm bg-sun" />
          Direction of the Sun
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="block h-[3px] w-4 rounded-sm bg-earth" />
          Direction of Earth
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="block h-[3px] w-4 rounded-sm bg-[#c9a24b]" />
          Lander
        </span>
      </div>
      <div className="px-6 pb-5 text-xs text-faint">
        {sky.error ? (
          <ErrorState
            message={errorMessage(sky.error)}
            onRetry={() => void sky.refetch()}
          />
        ) : sites.error && !point ? (
          <ErrorState
            message={errorMessage(sites.error)}
            onRetry={() => void sites.refetch()}
          />
        ) : sites.data && place.kind === 'site' && !site ? (
          <EmptyState>
            This link names a place Moon Maps does not know. Pick a place in
            step 1.
          </EmptyState>
        ) : data ? (
          <p>
            {horizonText(data.horizon_source)}
            {sky.isFetching ? <span className="ml-2">Updating…</span> : null}
          </p>
        ) : (
          <LoadingState label="Finding the Sun and the Earth…" />
        )}
      </div>
    </div>
  );
}
