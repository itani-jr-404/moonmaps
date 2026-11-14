import { describe, expect, it } from 'vitest';
import { parseScenarioQuery, scenarioQuery } from './url-sync';

describe('scenario url', () => {
  it('round-trips a curated site and a time', () => {
    const q = scenarioQuery(
      { kind: 'site', id: 'malapert-massif' },
      Date.UTC(2027, 2, 1, 6),
    );
    const back = parseScenarioQuery(q);
    expect(back.place).toEqual({ kind: 'site', id: 'malapert-massif' });
    expect(back.timeMs).toBe(Date.UTC(2027, 2, 1, 6));
  });

  it('round-trips a point and wraps 0..360 longitudes', () => {
    expect(parseScenarioQuery('lat=-89.5&lon=200').place).toEqual({
      kind: 'point',
      lat: -89.5,
      lon: -160,
    });
  });

  it('falls back safely on bad input', () => {
    expect(parseScenarioQuery('site=<script>&lat=999&lon=x&t=nope')).toEqual({
      place: null,
      timeMs: null,
    });
  });
});
