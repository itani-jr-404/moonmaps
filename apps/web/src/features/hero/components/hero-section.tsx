'use client';

import { useRef } from 'react';

import { ArrowIcon } from '@/components/ui/icons';

import { useHeroScene } from '../hooks/use-hero-scene';
import { useSouthPoleSky } from '../hooks/use-south-pole-sky';
import { HeroLive } from './hero-live';
import { Preloader } from './preloader';
import styles from './hero.module.css';

/**
 * The opening screen: the fixed 3D stage, the preloader, and the hero copy
 * with the live south pole readout. Section id `top`.
 */
export function HeroSection() {
  const stageRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const preloaderRef = useRef<HTMLDivElement>(null);

  const sky = useSouthPoleSky();
  const { progress, introDone } = useHeroScene(
    {
      stage: stageRef,
      section: sectionRef,
      pin: pinRef,
      copy: copyRef,
      preloader: preloaderRef,
    },
    !sky.isPending,
  );

  return (
    <>
      <div ref={stageRef} className={styles.stage} aria-hidden="true" />
      {introDone ? null : <Preloader ref={preloaderRef} progress={progress} />}
      <section
        ref={sectionRef}
        id="top"
        className={`${styles.hero} ${styles.pending}`}
        aria-labelledby="hero-title"
      >
        <div ref={pinRef} className={`wrap ${styles.pin}`}>
          <div ref={copyRef} className={styles.copy}>
            <p className={`eyebrow ${styles.eyebrow}`} data-hero-fade>
              NASA Space Apps / Moon South Pole
            </p>
            <h1 id="hero-title" className={`${styles.h1} font-display`}>
              <span className="line">
                <span className="li">Pick the site.</span>
              </span>
              <span className="line">
                <span className="li">
                  <i className={styles.dash} aria-hidden="true" />
                  <em>Pick the hour.</em>
                </span>
              </span>
            </h1>
            <p
              className={styles.sub}
              data-hero-fade
              title="Tip: click the empty space to spin the astronaut"
            >
              Find out in seconds whether a place and a date on the Moon are
              good for landing: enough sunlight for power, and Earth in sight to
              call home.
            </p>
            <div className={styles.cta} data-hero-fade>
              <a href="#navigator" className="btn btn-accent" data-magnetic>
                <span className="btn-label">
                  Plan a landing
                  <ArrowIcon />
                </span>
              </a>
              <a href="#land" className="btn btn-ghost" data-magnetic>
                <span className="btn-label">Choose a landing</span>
              </a>
            </div>
            <HeroLive sky={sky} />
          </div>
        </div>
        <div className={styles.heroUi}>
          <div className={styles.scrollInd} data-hero-fade aria-hidden="true">
            <span className={styles.rail} />
            <span>Scroll</span>
          </div>
        </div>
      </section>
    </>
  );
}
