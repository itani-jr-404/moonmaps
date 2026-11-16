import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const motion = vi.hoisted(() => ({ reduced: false }));
vi.mock('@/lib/motion/reduced-motion', () => ({
  useReducedMotion: () => motion.reduced,
}));

import { BestSpotDemo, FlightCheckDemo } from './future-demos';

afterEach(() => {
  cleanup();
  motion.reduced = false;
});

describe('Future scope illustrations', () => {
  it('label the flight check as an illustration and describe it', () => {
    render(<FlightCheckDemo />);
    expect(screen.getByText('Illustration, made-up data')).toBeTruthy();
    expect(
      screen.getByRole('img', {
        name: /fresh crater inside the landing circle/,
      }),
    ).toBeTruthy();
    expect(screen.getByText('Backup: Sun ✓ Earth ✓')).toBeTruthy();
    // The caption names the instrument and the signals.
    expect(
      screen.getByText(/visible light, 0\.5 m per pixel.*K-band radio/s),
    ).toBeTruthy();
  });

  it('label the best-spot search as an illustration and describe it', () => {
    render(<BestSpotDemo />);
    expect(screen.getByText('Illustration, made-up data')).toBeTruthy();
    expect(
      screen.getByRole('img', { name: /split into quarters/ }),
    ).toBeTruthy();
    expect(screen.getByText('30 days at the chosen point')).toBeTruthy();
    expect(screen.getByText(/samples disagree \(amber\)/)).toBeTruthy();
  });

  it('pause and play the loop from a button', () => {
    const { container } = render(<BestSpotDemo />);
    const box = container.firstElementChild!;
    expect(box.hasAttribute('data-paused')).toBe(false);
    fireEvent.click(
      screen.getByRole('button', { name: 'Pause the animation' }),
    );
    expect(box.hasAttribute('data-paused')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Play the animation' }));
    expect(box.hasAttribute('data-paused')).toBe(false);
  });

  it('show no pause button when motion is reduced, because nothing moves', () => {
    motion.reduced = true;
    render(<FlightCheckDemo />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Illustration, made-up data')).toBeTruthy();
  });
});
