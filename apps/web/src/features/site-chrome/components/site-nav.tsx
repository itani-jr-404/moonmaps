'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { LogoMark } from '@/components/ui/icons';
import { useReducedMotion } from '@/lib/motion/reduced-motion';
import { useSmoothScroll } from '@/lib/motion/smooth-scroll';
import { isActive, NAV_PAGES } from '@/lib/routes';
import { useIntroStore } from '@/lib/state/intro-store';
import { useMagnetic } from './magnetic';
import styles from './site-nav.module.css';

/** Scroll distances from the prototype: solid background after 40px, hide only below 240px. */
const SOLID_AFTER = 40;
const HIDE_AFTER = 240;
/** Ignore scroll jitter smaller than this before hiding or showing the bar. */
const SCROLL_SLOP = 4;
/** Let the menu start closing before the page scrolls under it. */
const CLOSE_THEN_SCROLL_MS = 120;

export function SiteNav() {
  const pathname = usePathname();
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
      const go = () => {
        scrollTo(target);
        // The skip link's target takes focus too, so keyboard users land in the page.
        if (target?.hasAttribute('tabindex'))
          target.focus({ preventScroll: true });
      };
      if (wasOpen) window.setTimeout(go, CLOSE_THEN_SCROLL_MS);
      else go();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [scrollTo]);

  // The logo goes home; on the home page it scrolls back to the top instead.
  const onLogo = (e: React.MouseEvent) => {
    setMenuOpen(false);
    if (pathname !== '/') return;
    e.preventDefault();
    scrollTo(null);
  };

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
          <Link
            href="/"
            className={styles.logo}
            aria-label="Moon Maps, home"
            onClick={onLogo}
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
          </Link>
          <nav aria-label="Primary">
            <ul className={styles.links}>
              {NAV_PAGES.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={
                      isActive(pathname, l.href) ? 'page' : undefined
                    }
                  >
                    {l.short}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className={styles.end}>
            <Link
              ref={magnetic}
              href="/planner"
              className={clsx('btn btn-accent btn-sm', styles.cta)}
            >
              <span className="btn-label">Open the planner</span>
            </Link>
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
          {NAV_PAGES.map((l, i) => (
            <li key={l.href} style={{ '--i': i } as CSSProperties}>
              <Link
                href={l.href}
                aria-current={isActive(pathname, l.href) ? 'page' : undefined}
                tabIndex={menuOpen ? undefined : -1}
                onClick={() => setMenuOpen(false)}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ol>
        <Link
          href="/planner"
          className={clsx('btn btn-accent', styles.menuCta)}
          tabIndex={menuOpen ? undefined : -1}
          onClick={() => setMenuOpen(false)}
        >
          <span className="btn-label">Open the planner</span>
        </Link>
      </div>
    </>
  );
}
