'use client';

import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';
import { revealKeyframes, revealSteps } from '../lib/reveal';

/**
 * Opens and closes the panel: a clip-path window grows out of the launcher, then the corner
 * brackets draw in; closing shrinks it back onto the launcher. The keyframes are built once
 * (again only after a resize) and shared between opening and closing. With reduced motion the
 * panel simply appears and disappears.
 *
 * Visibility is set on the shell directly, not through React, so the panel stays visible until
 * the closing animation has finished.
 */
export function useReveal(
  open: boolean,
  reduced: boolean,
  shellRef: RefObject<HTMLElement | null>,
  launcherRef: RefObject<HTMLElement | null>,
): void {
  const keyframes = useRef<Keyframe[] | null>(null);
  const running = useRef<Animation[]>([]);
  const first = useRef(true);

  useEffect(() => {
    const forget = () => {
      keyframes.current = null;
    };
    window.addEventListener('resize', forget);
    return () => window.removeEventListener('resize', forget);
  }, []);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const wasFirst = first.current;
    first.current = false;
    running.current.forEach((a) => a.cancel());
    running.current = [];

    const panel = shell.querySelector<HTMLElement>('[data-hud="panel"]');
    const brackets = shell.querySelectorAll<HTMLElement>(
      '[data-hud="bracket"]',
    );
    const canAnimate =
      !reduced && !!panel && typeof panel.animate === 'function';

    if (open) shell.style.visibility = 'visible';
    else if (wasFirst || !canAnimate || !keyframes.current) {
      shell.style.visibility = '';
      return;
    }
    if (!canAnimate) return;

    keyframes.current ??= build(panel, launcherRef.current);
    const steps = revealSteps(open ? 'open' : 'close', keyframes.current);
    const list = steps.flatMap((step) => {
      const el = step.target === 'panel' ? panel : brackets[step.index ?? 0];
      return el ? [el.animate(step.keyframes, step.timing)] : [];
    });
    running.current = list;
    Promise.all(list.map((a) => a.finished))
      .then(() => {
        if (running.current !== list) return;
        if (!open) shell.style.visibility = '';
        // The end state equals the elements' own styles, so the fills can go.
        list.forEach((a) => a.cancel());
        running.current = [];
      })
      .catch(() => {
        // Cancelled by a newer open or close.
      });
  }, [open, reduced, shellRef, launcherRef]);
}

function build(panel: HTMLElement, launcher: HTMLElement | null): Keyframe[] {
  const p = panel.getBoundingClientRect();
  const l = launcher?.getBoundingClientRect() ?? {
    left: p.right - 60,
    top: p.bottom - 60,
    width: 60,
    height: 60,
  };
  const radius = (el: Element | null) =>
    el ? parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0 : 0;
  return revealKeyframes(p, l, launcher ? radius(launcher) : 18, radius(panel));
}
