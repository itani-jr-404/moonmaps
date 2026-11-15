'use client';

import { ErrorState, LoadingState } from '@/components/ui/states';
import { errorMessage, type ScenarioResult } from '@/lib/api/client';
import { useSiteOutlook } from '@/lib/api/hooks';
import { fmtUtcDay } from '@/lib/format/format';

import { dailyForecast, hoursText } from '../lib/outlook';
import {
  azToX,
  elToY,
  fitElevation,
  skylinePath,
  trackPaths,
  type PanoramaFrame,
} from '../lib/panorama';
import { OUTLOOK_DAYS } from './landing-outlook';

const FORECAST_DAYS = 14;
/** How many days of Sun and Earth tracks the panorama draws. */
const PANORAMA_DAYS = 3;
const W = 720;
const H = 220;

/** "Sky forecast": day cards like a weather forecast, and the horizon panorama. */
export function SkyForecast({
  site,
  nowIso,
}: {
  site: { id: string } | { lat: number; lon: number };
  nowIso: string;
}) {
  // Same query as LandingOutlook, so the page makes one request for both.
  const q = useSiteOutlook(site, nowIso, OUTLOOK_DAYS, true);

  return (
    <section
      className="panel p-6 md:p-8"
      aria-labelledby="forecast-h"
      data-testid="sky-forecast"
    >
      <p className="eyebrow">Sky forecast</p>
      <h2 id="forecast-h" className="mt-3 font-display text-2xl font-light">
        The next {FORECAST_DAYS} days, day by day
      </h2>
      <p className="mt-2 text-[13px] text-faint">
        Hours per day in UTC. The first day starts now, so it has fewer hours.
      </p>
      <div className="mt-6">
        {q.isPending ? (
          <LoadingState label="Building the forecast…" />
        ) : q.isError ? (
          <ErrorState
            message={errorMessage(q.error)}
            onRetry={() => void q.refetch()}
          />
        ) : !q.data.series || q.data.series.t.length === 0 ? (
          <p className="text-[15px] text-faint">
            The API sent no hourly data for this site.
          </p>
        ) : (
          <>
            <ForecastStrip result={q.data} />
            <Panorama result={q.data} />
          </>
        )}
      </div>
    </section>
  );
}

function ForecastStrip({ result }: { result: ScenarioResult }) {
  const days = dailyForecast(
    result.series!,
    result.step_minutes,
    FORECAST_DAYS,
  );
  return (
    <ol
      className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-3"
      aria-label="Hours of sunlight and Earth in view per day"
      data-testid="forecast-days"
      data-lenis-prevent
    >
      {days.map((d) => {
        const partial = d.coveredHours < 23.9;
        return (
          <li
            key={d.dayMs}
            className="min-w-[128px] snap-start rounded-xl border border-line px-3 py-3 text-[13px]"
          >
            <b className="block">{fmtUtcDay(d.dayMs)}</b>
            {partial ? (
              <span className="block text-[11px] text-faint">
                {hoursText(d.coveredHours)} checked
              </span>
            ) : null}
            <dl className="mono mt-2 grid gap-1">
              <div className="flex justify-between gap-2">
                <dt className="text-sun">Sun</dt>
                <dd>{hoursText(d.sunHours)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-earth">Earth</dt>
                <dd>{hoursText(d.earthHours)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-ok">Both</dt>
                <dd>{hoursText(d.bothHours)}</dd>
              </div>
            </dl>
            <Bar part={d.bothHours / Math.max(1, d.coveredHours)} />
          </li>
        );
      })}
    </ol>
  );
}

function Bar({ part }: { part: number }) {
  return (
    <span
      className="mt-2 block h-1.5 overflow-hidden rounded-full bg-line"
      aria-hidden="true"
    >
      <span
        className="block h-full rounded-full bg-ok"
        style={{
          width: `${Math.round(Math.min(1, Math.max(0, part)) * 100)}%`,
        }}
      />
    </span>
  );
}

const COMPASS = [
  { az: 0, label: 'N' },
  { az: 90, label: 'E' },
  { az: 180, label: 'S' },
  { az: 270, label: 'W' },
];

function Panorama({ result }: { result: ScenarioResult }) {
  const s = result.series!;
  const horizon = result.horizon.elevation_deg;
  const start = Date.parse(s.t[0]!);
  const until = start + PANORAMA_DAYS * 86_400_000;
  const n = s.t.findIndex((t) => Date.parse(t) >= until);
  const count = n === -1 ? s.t.length : n;
  const sunAz = s.sun_az.slice(0, count);
  const sunEl = s.sun_el.slice(0, count);
  const earthAz = s.earth_az.slice(0, count);
  const earthEl = s.earth_el.slice(0, count);

  // Fit the skyline, plus the parts of the tracks near or above it.
  const horizonMax = Math.max(...horizon);
  const horizonMin = Math.min(...horizon);
  const near = (el: number) => el >= horizonMin - 2;
  const { minEl, maxEl } = fitElevation([
    ...horizon,
    ...sunEl.filter(near),
    ...earthEl.filter(near),
    horizonMax + 2,
  ]);
  const frame: PanoramaFrame = { width: W, height: H, minEl, maxEl };
  const hide = (el: number) => (el < minEl ? NaN : el);
  const sunPaths = trackPaths(sunAz, sunEl.map(hide), frame);
  const earthPaths = trackPaths(earthAz, earthEl.map(hide), frame);
  const ticks = [];
  const tickStep = maxEl - minEl > 20 ? 10 : maxEl - minEl > 8 ? 2 : 1;
  for (
    let e = Math.ceil(minEl / tickStep) * tickStep;
    e <= maxEl;
    e += tickStep
  )
    ticks.push(e);

  return (
    <figure className="mt-8" data-testid="horizon-panorama">
      <figcaption className="mb-3">
        <b className="font-display text-xl font-light">Horizon panorama</b>
        <span className="mt-1 block text-[13px] text-faint">
          The terrain skyline all around the site, and where the{' '}
          <span className="text-sun">Sun</span> and the{' '}
          <span className="text-earth">Earth</span> move over the next{' '}
          {PANORAMA_DAYS} days. Dots show where they are now. Left to right is
          the direction from north, through east, south and west. Terrain from{' '}
          {result.horizon.source === 'sphere'
            ? 'a smooth Moon (no terrain map here)'
            : `the ${result.horizon.source} map`}
          .
        </span>
      </figcaption>
      <div className="overflow-x-auto" data-lenis-prevent>
        <svg
          viewBox={`-28 -8 ${W + 36} ${H + 30}`}
          className="block w-full min-w-[560px]"
          role="img"
          aria-label={`Terrain horizon with the Sun and Earth tracks for the next ${PANORAMA_DAYS} days`}
        >
          <rect
            x="0"
            y="0"
            width={W}
            height={H}
            fill="rgb(156 194 255 / 0.04)"
          />
          {ticks.map((e) => (
            <g key={e}>
              <line
                x1="0"
                x2={W}
                y1={elToY(e, frame)}
                y2={elToY(e, frame)}
                stroke="rgb(156 194 255 / 0.12)"
                strokeDasharray={e === 0 ? undefined : '2 4'}
              />
              <text
                x="-6"
                y={elToY(e, frame) + 3}
                textAnchor="end"
                fontSize="10"
                fill="rgb(232 238 248 / 0.55)"
              >
                {e}°
              </text>
            </g>
          ))}
          {sunPaths.map((d, i) => (
            <path
              key={`s${i}`}
              d={d}
              fill="none"
              stroke="var(--color-sun)"
              strokeWidth="1.6"
              strokeDasharray="4 3"
            />
          ))}
          {earthPaths.map((d, i) => (
            <path
              key={`e${i}`}
              d={d}
              fill="none"
              stroke="var(--color-earth)"
              strokeWidth="1.6"
            />
          ))}
          <path
            d={skylinePath(horizon, result.horizon.az_step_deg, frame)}
            fill="#1a2438"
            stroke="rgb(156 194 255 / 0.5)"
            strokeWidth="1"
          />
          {sunEl[0] !== undefined && sunEl[0] >= minEl ? (
            <circle
              cx={azToX(sunAz[0]!, frame)}
              cy={elToY(sunEl[0], frame)}
              r="5"
              fill="var(--color-sun)"
            />
          ) : null}
          {earthEl[0] !== undefined && earthEl[0] >= minEl ? (
            <circle
              cx={azToX(earthAz[0]!, frame)}
              cy={elToY(earthEl[0], frame)}
              r="5"
              fill="var(--color-earth)"
            />
          ) : null}
          {COMPASS.map((c) => (
            <text
              key={c.label}
              x={azToX(c.az, frame)}
              y={H + 16}
              textAnchor="middle"
              fontSize="11"
              fill="rgb(232 238 248 / 0.7)"
            >
              {c.label}
            </text>
          ))}
        </svg>
      </div>
    </figure>
  );
}
