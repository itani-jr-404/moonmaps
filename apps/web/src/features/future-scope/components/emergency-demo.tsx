'use client';

import { useId, useState } from 'react';

import { compassWord } from '@/lib/format/format';
import { useReducedMotion } from '@/lib/motion/reduced-motion';

import styles from './future-demos.module.css';

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
