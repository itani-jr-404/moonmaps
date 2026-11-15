import Link from 'next/link';

import { LogoMark } from '@/components/ui/icons';
import { NAV_PAGES } from '@/lib/routes';
import { FooterWatermark } from './footer-watermark';
import styles from './site-footer.module.css';

/*
  Credit lines for the material the site uses. Each source is listed in
  docs/reference/references.md and docs/data/sources.md; the LOLA link is the browse page
  of the south pole gridded maps the API downloads.
*/
const CREDITS = [
  {
    href: 'https://svs.gsfc.nasa.gov/4720',
    label: "Moon maps: NASA's Scientific Visualization Studio (CGI Moon Kit)",
  },
  {
    href: 'https://science.nasa.gov/3d-resources/',
    label: 'Astronaut and lunar module models: NASA 3D Resources',
  },
  {
    href: 'https://imbrium.mit.edu/BROWSE/LOLA_GDR/POLAR/SOUTH_POLE',
    label: 'Terrain: NASA LRO LOLA',
  },
  {
    href: 'https://ssd.jpl.nasa.gov/horizons/',
    label: 'Positions checked against NASA JPL Horizons',
  },
] as const;

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className="wrap">
        <div className={styles.grid}>
          <div>
            <Link href="/" className={styles.logo} aria-label="Moon Maps, home">
              <LogoMark size={34} />
              <span className={styles.logoText}>
                <span>Moon</span>
                <span>Maps</span>
              </span>
            </Link>
            <p className={styles.blurb}>
              Every landing starts with light. A NASA Space Apps Challenge 2026
              entry for comparing Moon landing sites and dates.
            </p>
          </div>
          <div className={styles.col}>
            <h4>Explore</h4>
            <ul>
              {NAV_PAGES.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.col}>
            <h4>Credits</h4>
            <ul>
              {CREDITS.map((c) => (
                <li key={c.href}>
                  <a href={c.href} target="_blank" rel="noopener noreferrer">
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className={styles.note}>NASA does not endorse this project.</p>
          </div>
        </div>
        <div className={styles.bottom}>
          <span>
            © 2026 Moon Maps, team Lunar Titans. Built for NASA Space Apps.
          </span>
          <span>Sun. Earth. Horizon.</span>
        </div>
      </div>
      <FooterWatermark />
    </footer>
  );
}
