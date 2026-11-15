'use client';

import { useEffect, useState } from 'react';
import { typedLength, typedText } from '../lib/type-out';

/**
 * Types `text` out quickly when `active` (a fresh answer), or shows it whole at once (an older
 * answer, or reduced motion). Calls `onDone` once the whole text is on screen.
 */
export function useTypeOut(
  text: string,
  active: boolean,
  reduced: boolean,
  onDone?: () => void,
): { shown: string; typing: boolean } {
  const animate = active && !reduced;
  const [length, setLength] = useState(animate ? 0 : text.length);

  useEffect(() => {
    if (!animate) return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const n = typedLength(text.length, now - start);
      setLength(n);
      if (n < text.length) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [animate, text]);

  const typing = animate && length < text.length;
  useEffect(() => {
    if (active && !typing) onDone?.();
  }, [active, typing, onDone]);

  return { shown: typing ? typedText(text, length) : text, typing };
}
