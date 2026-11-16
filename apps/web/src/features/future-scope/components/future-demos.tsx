import styles from './future-demos.module.css';
import { LoopBox } from './loop-box';

/*
  Small illustrations for two Future scope ideas, shown on the About page and on Home. They are
  pictures of how the ideas could look, with made-up data, and the box says so. The instrument,
  the radio band and the search method they name come from research/future-scope-demos.md:
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
