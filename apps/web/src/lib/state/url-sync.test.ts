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

describe('useScenarioUrlSync', () => {
  it('writes the first real change of a fresh visit to the address', async () => {
    const { renderHook, act } = await import('@testing-library/react');
    const { useScenarioUrlSync } = await import('./url-sync');
    const { useScenarioStore } = await import('./scenario-store');
    window.history.replaceState(null, '', '/');
    const hook = renderHook(() => useScenarioUrlSync());
    const start = useScenarioStore.getState().timeMs;

    act(() => useScenarioStore.getState().setTime(start));
    expect(window.location.search).toBe('');

    act(() => useScenarioStore.getState().setTime(start + 3_600_000));
    expect(window.location.search).toContain('site=shackleton-ridge');
    expect(window.location.search).toContain('t=');
    hook.unmount();
  });
});
