import { describe, expect, it } from 'vitest';

import type { Site } from '@/lib/api/client';
import { chatContext } from '@/features/assistant/lib/conversation';

import { PIN_PICK_DEG, pickPoint, placeOf } from './pick';

const site = (id: string, name: string, lat: number, lon: number): Site => ({
  id,
  name,
  lat,
  lon,
  kind: 'reference',
  description: '',
});

// Made-up sites: the coordinates only shape the test.
const SITES = [
  site('pole', 'Pole site', -89.9, 0),
  site('b', 'Site B', -84.8, 29.2),
];

describe('pickPoint', () => {
  it('keeps the real coordinates of a point near the pole site', () => {
    const p = pickPoint(SITES, -88.43, 47.18);
    expect(p).toEqual({
      lat: -88.4,
      lon: 47.2,
      siteId: null,
      label: 'Spot 88.4°S, 47.2°E',
      near: 'Pole site',
    });
  });

  it('keeps the real coordinates of a point near another site', () => {
    const p = pickPoint(SITES, -85.8, 31.04);
    expect(p.siteId).toBeNull();
    expect([p.lat, p.lon]).toEqual([-85.8, 31]);
    expect(p.near).toBe('Site B');
  });

  it('picks a site only when the pointer is on its pin', () => {
    const p = pickPoint(SITES, -84.85, 29.5);
    expect(p).toEqual({
      lat: -84.8,
      lon: 29.2,
      siteId: 'b',
      label: 'Site B',
      near: null,
    });
    expect(PIN_PICK_DEG).toBeLessThan(1);
  });

  it('names no site far from every site', () => {
    const p = pickPoint(SITES, 17.95, 58.87);
    expect(p).toMatchObject({ lat: 18, lon: 58.9, siteId: null, near: null });
    expect(p.label).toBe('Spot 18.0°N, 58.9°E');
  });

  it('works before the site list has loaded', () => {
    expect(pickPoint([], -89.97, 10)).toMatchObject({
      lat: -90,
      lon: 10,
      siteId: null,
      near: null,
    });
  });

  it('writes the 180th meridian as -180, the range the API takes', () => {
    expect(pickPoint([], -80, 179.97).lon).toBe(-180);
  });
});

describe('placeOf and the chat context', () => {
  it('sends the landed point itself when it is not a site', () => {
    const p = pickPoint(SITES, -88.43, 47.18);
    const t = Date.parse('2026-11-15T12:20:00Z');
    expect(chatContext(placeOf(p), t)).toEqual({
      lat: -88.4,
      lon: 47.2,
      t: '2026-11-15T12:20:00.000Z',
    });
  });

  it('sends the site id only when the site was picked', () => {
    const p = pickPoint(SITES, -84.8, 29.2);
    expect(placeOf(p)).toEqual({ kind: 'site', id: 'b' });
  });
});
