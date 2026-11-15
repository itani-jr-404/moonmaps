import { EarthArt, IceArt, LowSunArt } from './why-art';
import styles from './why-section.module.css';

/** "Why the south pole": three plain facts, each with a small animated drawing. */
export function WhySection() {
  return (
    <section className="section" id="why" aria-labelledby="why-h">
      <div className="wrap">
        <div className="mb-16">
          <p className="eyebrow" data-reveal>
            Why the south pole
          </p>
          <h2 className="h2" id="why-h" data-lines>
            <span className="line">
              <span className="li">Why does everyone</span>
            </span>
            <span className="line">
              <span className="li">
                <em>want to land there?</em>
              </span>
            </span>
          </h2>
          <p className="lead" data-reveal>
            Three simple facts explain it, and why picking the right day matters
            so much.
          </p>
        </div>
        <div className={styles.grid}>
          <article className={styles.card} data-reveal>
            <div className={styles.art} aria-hidden="true">
              <IceArt />
            </div>
            <span className={styles.n}>1</span>
            <h3>There is ice</h3>
            <p>
              Deep craters at the south pole never see the Sun, so they stay
              frozen. That ice can give astronauts{' '}
              <b>water to drink, air to breathe and fuel for rockets.</b>
            </p>
          </article>
          <article className={styles.card} data-reveal>
            <div className={styles.art} aria-hidden="true">
              <LowSunArt />
            </div>
            <span className={styles.n}>2</span>
            <h3>The Sun stays low</h3>
            <p>
              There, the Sun never rises high. It just slides along the edge of
              the sky, <b>like a sunset that never ends.</b> A small hill can
              block it, and then the lander loses power.
            </p>
          </article>
          <article className={styles.card} data-reveal>
            <div className={styles.art} aria-hidden="true">
              <EarthArt />
            </div>
            <span className={styles.n}>3</span>
            <h3>Earth comes and goes</h3>
            <p>
              From the south pole, Earth slowly <b>peeks up and hides again</b>{' '}
              behind the horizon. When it is hidden, the lander cannot call home
              on its own.
            </p>
          </article>
        </div>
        <p className={styles.sum} data-reveal>
          So a good landing needs <b>sunlight</b> and <b>Earth in sight</b> at
          the same time. That is exactly what this site checks for you.
        </p>
      </div>
    </section>
  );
}
