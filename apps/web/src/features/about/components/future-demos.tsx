'use client';

import Link from 'next/link';
import { useId, useState, type ReactNode } from 'react';

import { ArrowIcon } from '@/components/ui/icons';
import { compassWord } from '@/lib/format/format';
import { useReducedMotion } from '@/lib/motion/reduced-motion';

import styles from './future-demos.module.css';

/*
  Small illustrations for two Future scope ideas, shown on the About page and on Home. They are
  pictures of how the ideas could look, with made-up data, and the box says so. The instrument,
  the radio band and the search method they name come from these sources, read 2026-11-15:
  - LRO's Narrow Angle Camera images the ground in visible light at 0.5 m per pixel
    (https://lroc.im-ldi.com/about/specs), and LRO sends its data on K-band radio at 26 GHz
    (https://ipnpr.jpl.nasa.gov/progress_report/42-222/42-222B.html).
  - New impact craters do appear: LROC before-and-after images found 222 (Speyerer et al.,
    Nature 538, 2016, doi:10.1038/nature19829).
  - A coarse-to-fine quadtree searches coarse cells first, then the finer cells where something
    was found (Samet, ACM Computing Surveys 16(2), 1984,
    https://www.cs.umd.edu/users/hjs/pubs/SameCSUR84-ocr.pdf), keeping several cells per level
    rather than only the best one.
*/

/**
 * The frame of a looping illustration: its label and a Pause button. Content that starts moving
 * by itself and runs for more than 5 seconds needs a way to pause it (WCAG 2.2 success criterion
 * 2.2.2, https://www.w3.org/TR/WCAG22/#pause-stop-hide). With reduced motion the picture is
 * still, so there is no button.
 */
function LoopBox({ label, children }: { label: string; children: ReactNode }) {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  return (
    <div className={styles.box} data-paused={paused ? '' : undefined}>
      <div className={styles.head}>
        <p className={styles.label}>{label}</p>
        {reduced ? null : (
          <button
            type="button"
            className={styles.pause}
            aria-label={paused ? 'Play the animation' : 'Pause the animation'}
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? 'Play' : 'Pause'}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

const loop = (name: string | undefined) => `${styles.loop} ${name ?? ''}`;

/** 05: a new orbital image shows a fresh crater at the site; the target moves to a backup. */
export function FlightCheckDemo() {
  return (
    <LoopBox label="Illustration, made-up data">
      <svg
        viewBox="0 0 300 150"
        role="img"
        aria-label="Illustration: a new orbital image shows a fresh crater inside the landing circle, and the target moves to a backup site where the Sun and the Earth are still in view."
      >
        <rect width="300" height="150" rx="10" fill="#13203f" />
        {[
          [40, 40, 16],
          [266, 28, 12],
          [250, 124, 18],
          [40, 132, 10],
          [160, 132, 8],
        ].map(([x, y, r]) => (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={r}
            fill="#0e1830"
            stroke="#2c4378"
            strokeWidth="1.5"
          />
        ))}
        {/* The new orbital image sweeps over the site. */}
        <g className={loop(styles.scan)}>
          <rect x="0" y="10" width="300" height="2" fill="var(--color-sun)" />
        </g>
        <text
          x="10"
          y="16"
          className={`${styles.svgText} ${loop(styles.scanLabel)}`}
        >
          New LRO image · visible light
        </text>
        {/* Site A and the fresh crater. */}
        <circle
          cx="105"
          cy="78"
          r="24"
          fill="none"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          className={loop(styles.siteA)}
        />
        <circle cx="105" cy="78" r="3.5" className={loop(styles.siteADot)} />
        <circle
          cx="116"
          cy="69"
          r="6"
          fill="#2a1626"
          stroke="var(--color-warn)"
          strokeWidth="2"
          className={loop(styles.fresh)}
        />
        <circle
          cx="116"
          cy="69"
          r="6"
          fill="none"
          stroke="var(--color-warn)"
          strokeWidth="1.5"
          className={loop(styles.pulse)}
        />
        <text
          x="62"
          y="116"
          className={`${styles.svgText} ${loop(styles.warn)}`}
          style={{ fill: 'var(--color-warn)' }}
        >
          New crater in the landing circle
        </text>
        {/* The move to the backup site. */}
        <path
          d="M131 78 L196 82"
          stroke="var(--color-sun)"
          strokeWidth="1.5"
          fill="none"
          className={loop(styles.route)}
        />
        <circle
          cx="220"
          cy="82"
          r="22"
          fill="none"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          className={loop(styles.siteB)}
        />
        <circle
          cx="220"
          cy="82"
          r="3.5"
          fill="var(--color-ok)"
          className={loop(styles.siteBDot)}
        />
        <text
          x="220"
          y="54"
          textAnchor="middle"
          className={`${styles.svgText} ${loop(styles.ok)}`}
          style={{ fill: 'var(--color-ok)' }}
        >
          Backup: Sun ✓ Earth ✓
        </text>
      </svg>
      <p className={styles.caption}>
        A new image from the LRO orbiter&apos;s camera (visible light, 0.5 m per
        pixel, sent to Earth on K-band radio) shows a fresh crater at the site.
        Moon Maps checks that a backup site still has the Sun and the Earth in
        view, and the new target is sent to the lander.
      </p>
    </LoopBox>
  );
}

/** Long-run pattern for the time bar: 1 = Sun and Earth both in view in that slot. */
const SLOTS = [
  0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0,
  1, 0, 0, 0,
];

/** 06: a quadtree narrows the area down to one point, then the longest run is found. */
export function BestSpotDemo() {
  const area = { x: 10, y: 14, s: 120 };
  const h = area.s / 2;
  const q = area.s / 4;
  const e = area.s / 8;
  return (
    <LoopBox label="Illustration, made-up data">
      <svg
        viewBox="0 0 300 150"
        role="img"
        aria-label="Illustration: the area is split into quarters, the best cells are split again down to one point, then a sliding window finds that point's longest run with the Sun and the Earth both in view."
      >
        <defs>
          <radialGradient id="bs-hill" cx="0.3" cy="0.72" r="0.45">
            <stop offset="0%" stopColor="#3f9c8f" />
            <stop offset="100%" stopColor="#13203f" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bs-ridge" x1="0" x2="1">
            <stop offset="0%" stopColor="#13203f" stopOpacity="0" />
            <stop offset="50%" stopColor="#62d6a0" />
            <stop offset="100%" stopColor="#13203f" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="300" height="150" rx="10" fill="#13203f" />
        <rect
          x={area.x}
          y={area.y}
          width={area.s}
          height={area.s}
          fill="url(#bs-hill)"
          stroke="var(--color-line-2)"
        />
        <rect
          x={area.x + 66}
          y={area.y + 4}
          width="10"
          height="52"
          fill="url(#bs-ridge)"
        />
        {/* Level 1: four quarters; the two best are kept. */}
        <g className={loop(styles.l1)} fill="none">
          <path
            d={`M${area.x + h} ${area.y} V${area.y + area.s} M${area.x} ${area.y + h} H${area.x + area.s}`}
            stroke="rgb(195 206 226 / 0.35)"
          />
          <rect
            x={area.x + h}
            y={area.y}
            width={h}
            height={h}
            stroke="var(--color-ok)"
            strokeWidth="1.5"
          />
          <rect
            x={area.x}
            y={area.y + h}
            width={h}
            height={h}
            stroke="var(--color-ok)"
            strokeWidth="1.5"
          />
        </g>
        {/* Level 2: both kept quarters are split; the cell on the ridge is kept, and an amber cell whose samples disagree. */}
        <g className={loop(styles.l2)} fill="none">
          <path
            d={`M${area.x + h + q} ${area.y} V${area.y + h} M${area.x + h} ${area.y + q} H${area.x + area.s} M${area.x + q} ${area.y + h} V${area.y + area.s} M${area.x} ${area.y + h + q} H${area.x + h}`}
            stroke="rgb(195 206 226 / 0.35)"
          />
          <rect
            x={area.x + h}
            y={area.y}
            width={q}
            height={q}
            stroke="var(--color-ok)"
            strokeWidth="1.5"
          />
          <rect
            x={area.x + h}
            y={area.y + q}
            width={q}
            height={q}
            stroke="var(--color-sun)"
            strokeWidth="1.5"
          />
        </g>
        {/* Level 3: both kept cells are split again. */}
        <g className={loop(styles.l3)} fill="none">
          <path
            d={`M${area.x + h + e} ${area.y} V${area.y + h} M${area.x + h} ${area.y + e} H${area.x + h + q} M${area.x + h} ${area.y + q + e} H${area.x + h + q}`}
            stroke="rgb(195 206 226 / 0.35)"
          />
          <rect
            x={area.x + h}
            y={area.y + e}
            width={e}
            height={e}
            stroke="var(--color-ok)"
            strokeWidth="1.5"
          />
        </g>
        <circle
          cx={area.x + 67.5}
          cy={area.y + 22.5}
          r="4"
          fill="#fff"
          className={loop(styles.dot)}
        />
        {/* The time bar at the chosen point: 30 days. */}
        <text x="148" y="40" className={styles.svgText}>
          30 days at the chosen point
        </text>
        {SLOTS.map((v, i) => (
          <rect
            key={i}
            x={148 + i * 4.7}
            y="48"
            width="4"
            height="16"
            rx="1"
            fill={v ? 'var(--color-ok)' : '#22325c'}
            opacity={v ? 0.75 : 1}
          />
        ))}
        <rect
          x="148"
          y="44"
          width="2"
          height="24"
          fill="#fff"
          className={loop(styles.cursor)}
        />
        <rect
          x={148 + 5 * 4.7 - 1}
          y="45"
          width={9 * 4.7 + 1}
          height="22"
          rx="3"
          fill="none"
          stroke="#fff"
          strokeWidth="1.5"
          className={loop(styles.window)}
        />
        <text
          x="148"
          y="86"
          className={`${styles.svgText} ${loop(styles.answer)}`}
          style={{ fill: 'var(--color-ink)' }}
        >
          Longest run with the Sun and
        </text>
        <text
          x="148"
          y="98"
          className={`${styles.svgText} ${loop(styles.answer)}`}
          style={{ fill: 'var(--color-ink)' }}
        >
          the Earth both in view: 9 days
        </text>
      </svg>
      <p className={styles.caption}>
        The area is split into quarters. The best cells (green) are split again,
        and so is a cell whose samples disagree (amber), down to one point. Then
        one pass over the dates finds that point&apos;s longest run with the Sun
        and the Earth both in view.
      </p>
    </LoopBox>
  );
}

/*
  Emergency landing mode, as a simulation with made-up landing spots. The spacecraft's place is
  given the way the team proposed: its distance from the planned site and two angles, the angle
  from the site's vertical (the normal to the ground) and the direction of that tilt, clockwise
  from north (docs/science/conventions-and-ephemeris.md). From these the point on the ground
  under the craft and its height follow; the arrow points from that point to the nearest spot
  marked good. Over a few tens of km the ground is drawn flat. The map is a top view, so the
  craft's height does not show; a note under the map says so, because a position given in 3D
  looks closer to the site than its distance suggests. A real version would take the
  craft's position from its navigation and ask the API which spots have the Sun and the Earth
  in view at the landing time.
*/

/** Made-up spots, in km east and north of the planned site. */
export const SPOTS = [
  { x: 0, y: 0, good: false, name: 'Planned site' },
  { x: -8, y: 10, good: true, name: 'Spot B' },
  { x: 14, y: -6, good: true, name: 'Spot C' },
  { x: 5, y: 18, good: true, name: 'Spot D' },
  { x: -15, y: -12, good: true, name: 'Spot E' },
  { x: 10, y: 8, good: false, name: 'Spot F' },
  { x: -4, y: -9, good: false, name: 'Spot G' },
  { x: 18, y: 16, good: false, name: 'Spot H' },
] as const;

/** Fill of a spot that is not good: 4.3 to 1 against the map, above the 3 to 1 that WCAG 2.2
 * success criterion 1.4.11 asks of graphics (https://www.w3.org/TR/WCAG22/#non-text-contrast). */
const BAD_FILL = '#7384ad';
const MAP_FILL = '#13203f';

const HALF_KM = 25; // the map shows 50 km by 50 km
const VIEW = 200;
const toView = (km: number) => VIEW / 2 + (km / HALF_KM) * (VIEW / 2);

/** Ground point under the craft and its height, from distance and the two angles. */
export function craftPosition(
  distKm: number,
  fromVerticalDeg: number,
  azimuthDeg: number,
) {
  const t = (fromVerticalDeg * Math.PI) / 180;
  const a = (azimuthDeg * Math.PI) / 180;
  const ground = distKm * Math.sin(t);
  return {
    x: ground * Math.sin(a),
    y: ground * Math.cos(a),
    groundKm: ground,
    heightKm: distKm * Math.cos(t),
  };
}

/** The nearest spot marked good, its distance in km and its bearing clockwise from north. */
export function nearestGood(x: number, y: number) {
  let best: {
    spot: (typeof SPOTS)[number];
    km: number;
    bearing: number;
  } | null = null;
  for (const s of SPOTS) {
    if (!s.good) continue;
    const km = Math.hypot(s.x - x, s.y - y);
    if (!best || km < best.km) {
      const bearing =
        ((Math.atan2(s.x - x, s.y - y) * 180) / Math.PI + 360) % 360;
      best = { spot: s, km, bearing };
    }
  }
  return best!;
}

export function EmergencyDemo() {
  const id = useId();
  const reduced = useReducedMotion();
  const [dist, setDist] = useState(14);
  const [tilt, setTilt] = useState(40);
  const [dir, setDir] = useState(135);
  const [shown, setShown] = useState(false);

  const c = craftPosition(dist, tilt, dir);
  const target = nearestGood(c.x, c.y);
  const cx = toView(Math.max(-HALF_KM, Math.min(HALF_KM, c.x)));
  const cy = toView(-Math.max(-HALF_KM, Math.min(HALF_KM, c.y)));
  const tx = toView(target.spot.x);
  const ty = toView(-target.spot.y);
  // Unit vector from the craft to the spot, in map units (east when the two coincide).
  const span = Math.hypot(tx - cx, ty - cy);
  const away = span
    ? { x: (tx - cx) / span, y: (ty - cy) / span }
    : { x: 1, y: 0 };

  const slider = (
    label: string,
    value: number,
    set: (v: number) => void,
    min: number,
    max: number,
    unit: string,
  ) => (
    <label className={styles.field}>
      <span>
        {label}: <b>{value}</b>
        {unit}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          set(Number(e.target.value));
          setShown(false);
        }}
      />
    </label>
  );

  return (
    <div className={styles.box}>
      <p className={styles.label}>Simulation, made-up landing spots</p>
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        role="img"
        aria-labelledby={`${id}-desc`}
        className={styles.square}
      >
        <desc id={`${id}-desc`}>
          Top view, 50 km across, around the planned site. The spacecraft is
          above a point {c.groundKm.toFixed(1)} km from the site.
          {shown
            ? ` The arrow points to ${target.spot.name}, ${target.km.toFixed(1)} km away.`
            : ''}
        </desc>
        <rect width={VIEW} height={VIEW} rx="10" fill={MAP_FILL} />
        <path
          d={`M${VIEW / 2} 6 V${VIEW - 6} M6 ${VIEW / 2} H${VIEW - 6}`}
          stroke="rgb(195 206 226 / 0.12)"
        />
        <text x={VIEW / 2 + 3} y="14" className={styles.svgText}>
          N
        </text>
        <text x="8" y="14" className={styles.svgText}>
          Top view
        </text>
        {SPOTS.map((s) => (
          <g key={s.name}>
            <circle
              cx={toView(s.x)}
              cy={toView(-s.y)}
              r={s.name === 'Planned site' ? 6 : 4.5}
              fill={s.good ? 'var(--color-ok)' : BAD_FILL}
              stroke={s.name === 'Planned site' ? 'var(--color-warn)' : 'none'}
              strokeWidth="2"
            />
            {s.name === 'Planned site' ||
            (shown && s === target.spot) ? null : (
              <text
                x={toView(s.x) + 7}
                y={toView(-s.y) + 3}
                className={styles.svgText}
              >
                {s.name.slice(-1)}
              </text>
            )}
          </g>
        ))}
        <text x={toView(0) + 9} y={toView(0) - 2} className={styles.svgText}>
          Planned site
        </text>
        <text
          x={toView(0) + 9}
          y={toView(0) + 9}
          className={styles.svgText}
          style={{ fill: 'var(--color-warn)' }}
        >
          Earth hidden
        </text>
        {/* The craft, above its ground point. */}
        <circle
          cx={cx}
          cy={cy}
          r="7"
          fill="none"
          stroke="#fff"
          strokeDasharray="2 2"
        />
        <path
          d={`M${cx - 4} ${cy + 3} L${cx} ${cy - 5} L${cx + 4} ${cy + 3} Z`}
          fill="#fff"
        />
        {shown ? (
          <path
            key={`${tx}-${ty}-${cx}-${cy}`}
            d={`M${cx} ${cy} L${tx} ${ty}`}
            stroke="var(--color-sun)"
            strokeWidth="2.5"
            fill="none"
            markerEnd={`url(#${id}-arrow)`}
            className={reduced ? undefined : styles.draw}
            pathLength={1}
          />
        ) : null}
        {/* The chosen spot's letter sits past the spot, on the far side from the arrow. */}
        {shown ? (
          <text
            x={tx + away.x * 11}
            y={ty + away.y * 11}
            textAnchor="middle"
            dominantBaseline="central"
            className={styles.svgText}
            style={{ fill: 'var(--color-ink)', fontWeight: 600 }}
          >
            {target.spot.name.slice(-1)}
          </text>
        ) : null}
        <defs>
          <marker
            id={`${id}-arrow`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 Z" fill="var(--color-sun)" />
          </marker>
        </defs>
      </svg>
      <p className={styles.legend}>
        <span>
          <span
            className={styles.key}
            style={{ background: 'var(--color-ok)' }}
            aria-hidden="true"
          />
          Sun and Earth in view
        </span>
        <span>
          <span
            className={styles.key}
            style={{ background: BAD_FILL }}
            aria-hidden="true"
          />
          Sun or Earth hidden
        </span>
        <span>
          <span
            className={`${styles.key} ${styles.keyCraft}`}
            aria-hidden="true"
          />
          The craft
        </span>
      </p>
      <p className={styles.note}>
        This map is a top view of a position in 3D. The craft is drawn at the
        point on the ground directly below it, so its height does not show. The
        distance and bearing to the spot are along the ground.
      </p>
      <div className={styles.fields}>
        {slider('Distance from the site', dist, setDist, 1, 25, ' km')}
        {slider('Angle from the vertical', tilt, setTilt, 0, 85, '°')}
        {slider('Direction, clockwise from north', dir, setDir, 0, 359, '°')}
      </div>
      <p className={styles.caption}>
        The craft is {c.heightKm.toFixed(1)} km up, above a point{' '}
        {c.groundKm.toFixed(1)} km from the site.
      </p>
      <button
        type="button"
        className="btn btn-accent btn-sm mt-3"
        onClick={() => setShown(true)}
      >
        <span className="btn-label">Emergency landing</span>
      </button>
      <p className={styles.caption} aria-live="polite">
        {shown
          ? `Go to ${target.spot.name}: ${target.km.toFixed(1)} km along the ground, bearing ${Math.round(target.bearing)}° (${compassWord(target.bearing)}). Sun and Earth in view there.`
          : 'Press “Emergency landing” to point to the nearest good spot.'}
      </p>
    </div>
  );
}

const ITEMS = [
  { title: 'Watching the site during the flight', Demo: FlightCheckDemo },
  { title: 'The best spot in an area', Demo: BestSpotDemo },
  { title: 'Emergency landing mode', Demo: EmergencyDemo },
] as const;

/** Home: a preview of the planned Future scope ideas, with the same illustrations as /about. */
export function FuturePreview() {
  return (
    <section className="section" aria-labelledby="next-h">
      <div className="wrap">
        <p className="eyebrow" data-reveal>
          Coming next
        </p>
        <h2 className="h2" id="next-h" data-lines>
          <span className="line">
            <span className="li">A preview of</span>
          </span>
          <span className="line">
            <span className="li">
              <em>what comes next.</em>
            </span>
          </span>
        </h2>
        <p className="lead" data-reveal>
          Planned, not built yet. Each picture uses made-up data to show how the
          idea could look.
        </p>
        {/* Two columns keep the pictures wide enough to read; the tall simulation takes the
            second column. Three columns only where each is at least about 370 px wide. */}
        <div className="mt-12 grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
          {ITEMS.map(({ title, Demo }, i) => (
            <div
              key={title}
              className={`panel p-6 ${i === 2 ? 'md:col-start-2 md:row-span-2 md:row-start-1 xl:col-start-auto xl:row-span-1 xl:row-start-auto' : ''}`}
              data-reveal
            >
              <h3 className="font-display text-xl font-light">{title}</h3>
              <Demo />
            </div>
          ))}
        </div>
        <Link
          href="/about#future-h"
          className="btn btn-ghost mt-10"
          data-reveal
        >
          <span className="btn-label">See the Future scope</span>
          <ArrowIcon />
        </Link>
      </div>
    </section>
  );
}
