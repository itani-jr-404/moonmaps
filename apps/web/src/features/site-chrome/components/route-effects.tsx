'use client';

import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { useSmoothScroll } from '@/lib/motion/smooth-scroll';
import { useIntroStore } from '@/lib/state/intro-store';

/**
 * Page changes for the site chrome. The opening intro plays only on the home page:
 * a first visit to any other page counts the intro as done, so the nav, the scroll
 * reveals and the assistant start at once. Each new page starts at the top.
 */
export function RouteEffects() {
  const pathname = usePathname();
  const { lenis } = useSmoothScroll();

  useEffect(() => {
    if (pathname !== '/') useIntroStore.getState().finish();
  }, [pathname]);

  useEffect(() => {
    if (window.location.hash) return;
    lenis?.scrollTo(0, { immediate: true, force: true });
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(raf);
  }, [pathname, lenis]);

  return null;
}
