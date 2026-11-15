'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import styles from './page-transition.module.css';

/** False until the first page has rendered, so the first load (and the home intro) is not animated. */
let hasNavigated = false;

/**
 * Animates each new page in after a click in the site's navigation: it fades in and rises a
 * little. Home only fades, because a transform would become the containing block of its fixed
 * 3D stage and resize it. The class is removed when the animation ends, so the wrapper adds no
 * lasting stacking context. With reduced motion the CSS turns the animation off.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Read once when this page mounts; the template remounts on every navigation.
  const [animate, setAnimate] = useState(() => hasNavigated);
  useEffect(() => {
    hasNavigated = true;
  }, []);

  const className = !animate
    ? undefined
    : pathname === '/'
      ? styles.fade
      : styles.rise;

  return (
    <div
      className={className}
      data-page
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) setAnimate(false);
      }}
    >
      {children}
    </div>
  );
}

/** For tests: start again as if the site had just loaded. */
export function resetPageTransitionForTests() {
  hasNavigated = false;
}
