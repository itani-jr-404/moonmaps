import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/motion/reduced-motion', () => ({
  useReducedMotion: () => true,
}));

import { craftPosition, EmergencyDemo, nearestGood } from './emergency-demo';

afterEach(cleanup);

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
