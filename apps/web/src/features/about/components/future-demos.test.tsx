import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const motion = vi.hoisted(() => ({ reduced: false }));
vi.mock('@/lib/motion/reduced-motion', () => ({
  useReducedMotion: () => motion.reduced,
}));

import {
  BestSpotDemo,
  craftPosition,
  EmergencyDemo,
  FlightCheckDemo,
  nearestGood,
} from './future-demos';

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

describe('emergency landing simulation', () => {
  it('turns distance and two angles into a ground point and a height', () => {
    const straightUp = craftPosition(10, 0, 123);
    expect(straightUp.groundKm).toBeCloseTo(0);
    expect(straightUp.heightKm).toBeCloseTo(10);
    const east = craftPosition(10, 90, 90);
    expect(east.x).toBeCloseTo(10);
    expect(east.y).toBeCloseTo(0);
    expect(east.heightKm).toBeCloseTo(0);
  });

  it('picks the nearest spot marked good, never a bad one', () => {
    const n = nearestGood(0, 0);
    expect(n.spot.good).toBe(true);
    expect(n.spot.name).toBe('Spot B');
    expect(n.km).toBeCloseTo(Math.hypot(8, 10));
    // Bearing clockwise from north: B is to the north-west.
    expect(n.bearing).toBeGreaterThan(270);
    expect(n.bearing).toBeLessThan(360);
  });

  it('points to the nearest good spot when the button is pressed', () => {
    motion.reduced = true;
    render(<EmergencyDemo />);
    expect(screen.getByText('Simulation, made-up landing spots')).toBeTruthy();
    expect(screen.getByText(/top view of a position in 3D/)).toBeTruthy();
    // The legend says what the colours mean, and each spot carries its letter.
    expect(screen.getByText('Sun and Earth in view')).toBeTruthy();
    expect(screen.getByText('Sun or Earth hidden')).toBeTruthy();
    for (const letter of ['B', 'C', 'D', 'E', 'F', 'G', 'H'])
      expect(screen.getByText(letter)).toBeTruthy();
    expect(screen.getByText(/Press “Emergency landing”/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Emergency landing' }));
    expect(screen.getByText(/^Go to Spot [BCDE]: /)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Distance from the site/), {
      target: { value: '5' },
    });
    expect(screen.getByText(/Press “Emergency landing”/)).toBeTruthy();
  });
});
