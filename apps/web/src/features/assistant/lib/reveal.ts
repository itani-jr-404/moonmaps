/*
  The panel's opening and closing, as data, so it can be tested without a browser.

  Opening: a rounded clip-path window the size of the launcher grows out of the launcher's place
  to the whole panel (460 ms, ease-out). The contents fade up in three steps meanwhile (CSS, see
  assistant.module.css). At the end the four corner brackets draw in once (200 ms, 30 ms apart).
  Closing: the brackets fade (80 ms) while the window shrinks back onto the launcher (300 ms),
  playing the same keyframes backwards.

  With `direction: 'reverse'` the Web Animations API applies the easing to the reversed progress,
  so closing is given the mirror image of the ease-in curve cubic-bezier(0.4, 0, 1, 1), which is
  cubic-bezier(0, 0, 0.6, 1), to look like ease-in on screen.
  Spec: W3C, "Web Animations Level 1", section "Calculating the transformed progress",
  https://www.w3.org/TR/web-animations-1/ (read 2026-11-15).
*/

export const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
export const EASE_IN_REVERSED = 'cubic-bezier(0, 0, 0.6, 1)';

export const OPEN = {
  panel: { delay: 0, duration: 460 },
  bracket: { delay: 440, duration: 200, stagger: 30 },
} as const;

export const CLOSE = {
  bracket: { delay: 0, duration: 80 },
  panel: { delay: 0, duration: 300 },
} as const;

type Box = { left: number; top: number; width: number; height: number };

export type RevealStep = {
  target: 'panel' | 'bracket';
  /** Which bracket (0 top-left, 1 top-right, 2 bottom-right, 3 bottom-left). */
  index?: number;
  keyframes: Keyframe[];
  timing: KeyframeAnimationOptions & { duration: number; delay: number };
};

export const BRACKET_KEYFRAMES: Keyframe[] = [
  { opacity: 0, transform: 'scale(0.4)' },
  { opacity: 1, transform: 'scale(1)' },
];

/**
 * Two clip-path keyframes for the panel: a rounded window the size of the launcher, at the
 * launcher's place (moved inside the panel when the launcher sits outside it), growing to the
 * whole panel. Built once and played forwards to open and backwards to close.
 */
export function revealKeyframes(
  panel: Box,
  launcher: Box,
  launcherRadius: number,
  panelRadius: number,
): Keyframe[] {
  const w = Math.min(launcher.width, panel.width);
  const h = Math.min(launcher.height, panel.height);
  const clamp = (v: number, max: number) => Math.min(Math.max(v, 0), max);
  const left = clamp(launcher.left - panel.left, panel.width - w);
  const top = clamp(launcher.top - panel.top, panel.height - h);
  const right = panel.width - left - w;
  const bottom = panel.height - top - h;
  const px = (v: number) => `${Math.round(v * 10) / 10}px`;
  return [
    {
      clipPath: `inset(${px(top)} ${px(right)} ${px(bottom)} ${px(left)} round ${px(launcherRadius)})`,
    },
    { clipPath: `inset(0px 0px 0px 0px round ${px(panelRadius)})` },
  ];
}

/** Every animation of one opening or closing. The keyframes are shared between the two. */
export function revealSteps(
  phase: 'open' | 'close',
  panel: Keyframe[],
): RevealStep[] {
  const brackets = [0, 1, 2, 3];
  if (phase === 'open')
    return [
      {
        target: 'panel',
        keyframes: panel,
        timing: { ...OPEN.panel, easing: EASE_OUT, fill: 'both' },
      },
      ...brackets.map((index): RevealStep => ({
        target: 'bracket',
        index,
        keyframes: BRACKET_KEYFRAMES,
        timing: {
          delay: OPEN.bracket.delay + index * OPEN.bracket.stagger,
          duration: OPEN.bracket.duration,
          easing: EASE_OUT,
          fill: 'both',
        },
      })),
    ];
  const back = {
    direction: 'reverse',
    easing: EASE_IN_REVERSED,
    fill: 'both',
  } as const;
  return [
    ...brackets.map((index): RevealStep => ({
      target: 'bracket',
      index,
      keyframes: BRACKET_KEYFRAMES,
      timing: { ...CLOSE.bracket, ...back },
    })),
    { target: 'panel', keyframes: panel, timing: { ...CLOSE.panel, ...back } },
  ];
}

/** How long a phase lasts, from the first step's start to the last step's end. */
export function revealTotal(steps: RevealStep[]): number {
  return Math.max(...steps.map((s) => s.timing.delay + s.timing.duration));
}
