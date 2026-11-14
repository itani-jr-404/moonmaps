import styles from './about-section.module.css';

/*
  What the app does, the idea behind it, and its limits. Keep this text true to the app:
  - JPL ephemeris files and LOLA polar maps: docs/data/sources.md.
  - 16 Horizons cases within 0.05 degrees: apps/api/app/data/validation/horizons.json
    and docs/science/validation.md.
*/
export function AboutSection() {
  return (
    <section
      className="section border-t border-line bg-bg-2"
      id="about"
      aria-labelledby="about-h"
    >
      <div className="wrap">
        <div className="mb-16">
          <p className="eyebrow" data-reveal>
            About
          </p>
          <h2 className="h2" id="about-h" data-lines>
            <span className="line">
              <span className="li">Moon landings,</span>
            </span>
            <span className="line">
              <span className="li">
                <em>made easy to plan.</em>
              </span>
            </span>
          </h2>
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
              altimeter maps of the south pole. We test our angles against
              NASA&apos;s JPL Horizons system: across 16 test cases they agree
              to within 0.05 degrees.
            </p>
          </div>
          <div className={styles.col} data-reveal>
            <span className={styles.n}>03</span>
            <h3>Good to know</h3>
            <ul>
              <li>Made for the NASA Space Apps Challenge 2026.</li>
              <li>A planning and learning tool, not flight software.</li>
              <li>
                The horizon uses real LOLA terrain within about 15 degrees of
                the south pole. Elsewhere the Moon is treated as a smooth ball.
              </li>
              <li>
                The south pole matters because ice hides in its dark craters.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
