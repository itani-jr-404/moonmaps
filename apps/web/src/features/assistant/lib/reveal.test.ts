import { describe, expect, it } from 'vitest';
import {
  BRACKET_KEYFRAMES,
  revealKeyframes,
  revealSteps,
  revealTotal,
} from './reveal';

describe('revealKeyframes', () => {
  it('starts at the launcher when it is inside the panel (phone, full screen)', () => {
    const [from, to] = revealKeyframes(
      { left: 0, top: 0, width: 390, height: 844 },
      { left: 310, top: 764, width: 60, height: 60 },
      18,
      0,
    );
    expect(from!.clipPath).toBe('inset(764px 20px 20px 310px round 18px)');
    expect(to!.clipPath).toBe('inset(0px 0px 0px 0px round 0px)');
  });

  it('moves the start inside the panel when the launcher is below it (desktop)', () => {
    const [from, to] = revealKeyframes(
      { left: 860, top: 128, width: 400, height: 580 },
      { left: 1200, top: 720, width: 60, height: 60 },
      18,
      20,
    );
    expect(from!.clipPath).toBe('inset(520px 0px 0px 340px round 18px)');
    expect(to!.clipPath).toBe('inset(0px 0px 0px 0px round 20px)');
  });
});

describe('revealSteps', () => {
  const panel = revealKeyframes(
    { left: 0, top: 0, width: 400, height: 580 },
    { left: 340, top: 600, width: 60, height: 60 },
    18,
    20,
  );

  it('grows the window in 460 ms, then draws the four brackets once', () => {
    const steps = revealSteps('open', panel);
    const fold = steps.find((s) => s.target === 'panel')!;
    const brackets = steps.filter((s) => s.target === 'bracket');
    expect(fold.timing).toMatchObject({ delay: 0, duration: 460 });
    expect(brackets.map((b) => b.timing.delay)).toEqual([440, 470, 500, 530]);
    expect(brackets.every((b) => b.timing.duration === 200)).toBe(true);
    expect(revealTotal(steps)).toBe(730);
  });

  it('closes in 300 ms with the same keyframes played backwards', () => {
    const open = revealSteps('open', panel);
    const close = revealSteps('close', panel);
    expect(revealTotal(close)).toBe(300);
    expect(close.every((s) => s.timing.direction === 'reverse')).toBe(true);
    for (const t of ['panel', 'bracket'])
      expect(close.find((s) => s.target === t)!.keyframes).toBe(
        open.find((s) => s.target === t)!.keyframes,
      );
    expect(BRACKET_KEYFRAMES[1]).toEqual({ opacity: 1, transform: 'scale(1)' });
  });
});
