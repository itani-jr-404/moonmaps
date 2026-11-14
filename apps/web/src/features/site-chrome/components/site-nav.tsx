'use client';

import { clsx } from 'clsx';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { LogoMark } from '@/components/ui/icons';
import { useReducedMotion } from '@/lib/motion/reduced-motion';
import { useSmoothScroll } from '@/lib/motion/smooth-scroll';
import { useIntroStore } from '@/lib/state/intro-store';
import { useMagnetic } from './magnetic';
import styles from './site-nav.module.css';

const LINKS = [
  { href: '#why', label: 'Why the pole' },
  { href: '#navigator', label: 'Planner' },
  { href: '#land', label: 'Landing' },
  { href: '#about', label: 'About' },
] as const;

const MENU_LINKS = [
  { href: '#why', label: 'Why the pole' },
  { href: '#navigator', label: 'Planner' },
  { href: '#land', label: 'Choose a landing' },
  { href: '#about', label: 'About' },
] as const;

/** Scroll distances from the prototype: solid background after 40px, hide only below 240px. */
const SOLID_AFTER = 40;
const HIDE_AFTER = 240;
/** Ignore scroll jitter smaller than this before hiding or showing the bar. */
const SCROLL_SLOP = 4;
/** Let the menu start closing before the page scrolls under it. */
const CLOSE_THEN_SCROLL_MS = 120;

export function SiteNav() {
  const introDone = useIntroStore((s) => s.done);
  const reduced = useReducedMotion();
  const { scrollTo, lock } = useSmoothScroll();
  const [menuOpen, setMenuOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const openRef = useRef(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const magnetic = useMagnetic<HTMLAnchorElement>();

  useEffect(() => {
    openRef.current = menuOpen;
  }, [menuOpen]);

  // Hide on scroll down, show on scroll up; the bar gets its background once the page moves.
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setSolid(y > SOLID_AFTER);
      if (!openRef.current) {
        if (y > HIDE_AFTER && y > lastY + SCROLL_SLOP) setHidden(true);
        else if (y < lastY - SCROLL_SLOP) setHidden(false);
      }
      lastY = y;
    };
    const raf = requestAnimationFrame(onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // The page cannot scroll behind the open menu.
  useEffect(() => {
    if (!menuOpen) return;
    lock(true);
    return () => lock(false);
  }, [menuOpen, lock]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMenuOpen(false);
      burgerRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // Every in-page link on the site scrolls through Lenis, so jumps stay smooth and the
  // scroll position Lenis keeps stays in step with the page.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      if (!(e.target instanceof Element)) return;
      const a = e.target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href') ?? '';
      const target =
        id === '#top' ? null : document.getElementById(id.slice(1));
      if (id !== '#top' && !target) return;
      e.preventDefault();
      const wasOpen = openRef.current;
      if (wasOpen) setMenuOpen(false);
      const go = () => scrollTo(target);
      if (wasOpen) window.setTimeout(go, CLOSE_THEN_SCROLL_MS);
      else go();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [scrollTo]);

  const toggleMenu = () => {
    if (!menuOpen) setHidden(false);
    setMenuOpen(!menuOpen);
  };

  return (
    <>
      <header
        className={clsx(
          styles.nav,
          !(introDone || reduced) && styles.intro,
          solid && styles.solid,
          hidden && !menuOpen && styles.hidden,
          menuOpen && styles.menuOpen,
        )}
      >
        <div className={styles.bar}>
          <a
            href="#top"
            className={styles.logo}
            aria-label="Moon Maps, back to top"
          >
            <span className={styles.mark}>
              <LogoMark size={34} />
              <svg viewBox="0 0 40 40" aria-hidden="true">
                <circle
                  cx="20"
                  cy="20"
                  r="19"
                  fill="none"
                  stroke="rgba(156,194,255,.3)"
                  strokeWidth=".6"
                  strokeDasharray="1.5 3"
                />
              </svg>
            </span>
            <span className={styles.logoText}>
              <span>Moon</span>
              <span>Maps</span>
            </span>
          </a>
          <nav aria-label="Primary">
            <ul className={styles.links}>
              {LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className={styles.end}>
            <a
              ref={magnetic}
              href="#navigator"
              className={clsx('btn btn-accent btn-sm', styles.cta)}
            >
              <span className="btn-label">Open the planner</span>
            </a>
            <button
              ref={burgerRef}
              type="button"
              className={styles.burger}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={toggleMenu}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>
      <div
        id="site-menu"
        className={clsx(styles.menu, menuOpen && styles.open)}
        data-lenis-prevent
        aria-hidden={!menuOpen}
      >
        <ol>
          {MENU_LINKS.map((l, i) => (
            <li key={l.href} style={{ '--i': i } as CSSProperties}>
              <a href={l.href}>{l.label}</a>
            </li>
          ))}
        </ol>
        <a href="#navigator" className={clsx('btn btn-accent', styles.menuCta)}>
          <span className="btn-label">Open the planner</span>
        </a>
      </div>
    </>
  );
}
