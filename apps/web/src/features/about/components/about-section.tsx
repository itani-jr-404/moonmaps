import styles from './about-section.module.css';

/*
  What the app does, the idea behind it, and its limits. Keep this text true to the app:
  - JPL ephemeris files and LOLA polar maps: docs/data/sources.md.
  - The JPL Horizons check: 16 cases (2 places, Sun and Earth, 4 dates in 2026), pass rule
    0.05 degrees, largest difference 0.0001 degrees. From apps/api/app/data/validation/horizons.json,
    apps/api/tests/test_horizons.py and docs/science/validation.md; recomputed 2026-11-15.
*/
export function AboutSection() {
  return (
    <section
      className="section border-t border-line"
      id="about"
      aria-labelledby="about-h"
    >
      <div className="wrap">
        <div className="mb-16">
          <p className="eyebrow" data-reveal>
            About
          </p>
          <h1 className="h2" id="about-h" data-lines>
            <span className="line">
              <span className="li">Moon landings,</span>
            </span>
            <span className="line">
              <span className="li">
                <em>made easy to plan.</em>
              </span>
            </span>
          </h1>
        </div>
        <div className={styles.grid}>
          <div className={styles.col} data-reveal>
            <span className={styles.n}>01</span>
            <h3>What it does for you</h3>
            <ul>
              <li>
                Tells you in seconds if a place and time are good for landing.
              </li>
              <li>Finds the best dates to land in the next month.</li>
              <li>
                Lets you explore the whole Moon and land anywhere with one
                click.
              </li>
              <li>Uses plain words. No physics knowledge needed.</li>
              <li>Runs free in your browser. Nothing to install.</li>
            </ul>
          </div>
          <div className={styles.col} data-reveal>
            <span className={styles.n}>02</span>
            <h3>The simple idea behind it</h3>
            <p>
              A lander runs on sunlight and talks to Earth by radio. So two
              questions decide a landing: <b>Is the Sun up?</b> and{' '}
              <b>Can it see Earth?</b>
            </p>
            <p>
              The Moon is barely tilted, so near its south pole the Sun never
              climbs high. It slides along the edge of the sky, and a small hill
              can hide it. Earth hardly moves in the Moon&apos;s sky, but the
              Moon&apos;s slow wobble makes it rise and set near the pole.
            </p>
            <p>
              Positions of the Sun and the Earth come from NASA JPL&apos;s
              ephemeris files, and the horizon comes from NASA&apos;s LOLA laser
              altimeter maps of the south pole. We compared our Sun and Earth
              directions with NASA&apos;s JPL Horizons system in 16 cases: both
              bodies, seen from near the south pole (89.9° S, 0° E) and from the
              Apollo 11 landing site, at 00:00 UTC on 15, 22 and 29 November and
              6 December 2026. A case passes when azimuth and elevation are each
              within 0.05 degrees. All 16 pass, and the largest difference is
              0.0001 degrees. Like Horizons, this check uses a smooth Moon, so
              it tests the positions, not the terrain horizon.
            </p>
          </div>
          <div className={styles.col} data-reveal>
            <span className={styles.n}>03</span>
            <h3>Good to know</h3>
            <ul>
              <li>Made for the NASA Space Apps Challenge 2026.</li>
              <li>A planning and learning tool, not flight software.</li>
              <li>
                The horizon uses real LOLA terrain: fine maps within about 15
                degrees of the south pole, and a coarser global map (about 1.9
                km per pixel) everywhere else.
              </li>
              <li>
                The south pole matters because ice hides in its dark craters.
              </li>
            </ul>
          </div>
        </div>
        <h2 className="h3 mt-16 mb-8" id="future-h" data-reveal>
          Future scope
        </h2>
        <p className="mb-8" data-reveal>
          Planned, not built yet.
        </p>
        <div className={styles.grid} aria-labelledby="future-h">
          <div className={styles.col} data-reveal>
            <span className={styles.n}>04</span>
            <h3>Relay satellites</h3>
            <p>
              Moon Maps checks the direct link between the site and the Earth. A
              relay satellite in orbit can keep a lander connected even when the
              Earth is hidden behind the terrain. Counting relay coverage is the
              next step we are working on.
            </p>
          </div>
          <div className={styles.col} data-reveal>
            <span className={styles.n}>05</span>
            <h3>Watching the site during the flight</h3>
            <p>
              The Sun and the Earth move on schedule, so a good landing time
              stays good unless the landing slips. The ground can still change.
              During the trip, the site would be checked again and again against
              new orbital images and hazard data, such as a fresh impact crater,
              so the crew can pick another site before landing.
            </p>
          </div>
          <div className={styles.col} data-reveal>
            <span className={styles.n}>06</span>
            <h3>The best spot in an area</h3>
            <p>
              You mark an area with 4 corners and pick a start and end date.
              Moon Maps finds the point and the date that give the longest run
              of good days. Points close together usually behave alike, so a
              coarse-to-fine quadtree search narrows the area step by step, and
              a sliding window over time finds the longest good run at each
              point.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
