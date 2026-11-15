'use client';

import { type RefObject, useEffect } from 'react';

/** True when `el` can still scroll by `delta` pixels on the vertical axis. */
export function canScroll(el: HTMLElement, delta: number): boolean {
  const style = getComputedStyle(el);
  if (!/(auto|scroll)/.test(style.overflowY)) return false;
  if (el.scrollHeight <= el.clientHeight) return false;
  if (delta < 0) return el.scrollTop > 0;
  return el.scrollTop + el.clientHeight < el.scrollHeight - 1;
}

/** The nearest element between `target` and `root` that can scroll by `delta`, if any. */
export function scrollableBetween(
  target: EventTarget | null,
  root: HTMLElement,
  delta: number,
): HTMLElement | null {
  let el = target instanceof HTMLElement ? target : null;
  while (el && root.contains(el)) {
    if (canScroll(el, delta)) return el;
    if (el === root) break;
    el = el.parentElement;
  }
  return null;
}

/**
 * Keeps wheel and touch scrolling inside the panel. Over a part that cannot scroll (the header,
 * the strip, the input, or a list already at its end) the event is cancelled, so the page behind
 * does not move. A part that can scroll scrolls as usual.
 */
export function useContainScroll(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    const root = ref.current;
    if (!root || !active) return;
    let lastY = 0;

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return; // pinch zoom
      if (!scrollableBetween(event.target, root, event.deltaY))
        event.preventDefault();
    };
    const onTouchStart = (event: TouchEvent) => {
      lastY = event.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY ?? lastY;
      const delta = lastY - y;
      lastY = y;
      if (!scrollableBetween(event.target, root, delta)) event.preventDefault();
    };

    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('touchstart', onTouchStart, { passive: true });
    root.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchmove', onTouchMove);
    };
  }, [ref, active]);
}
