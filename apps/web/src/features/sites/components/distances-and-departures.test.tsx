import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ScenarioResult } from '@/lib/api/client';

const hooks = vi.hoisted(() => ({
  useMissions: vi.fn(),
  useSiteOutlook: vi.fn(),
  useDepartures: vi.fn(),
}));
vi.mock('@/lib/api/hooks', () => hooks);

import { DepartureList, GettingThere } from './getting-there';
import { DistanceRow } from './right-now';

afterEach(cleanup);

const NOW = '2026-11-15T00:00:00Z';
const ARRIVAL = '2026-12-01T12:00:00Z';
const DEPARTURES = [
  {
    mission_id: 'apollo-11',
    name: 'Apollo 11',
    travel_hours: 102.76,
    depart: '2026-11-27T05:14:20Z',
    source_url:
      'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059A',
  },
  {
    mission_id: 'slim',
    name: 'SLIM',
    travel_hours: 3231.63,
    depart: '2026-07-19T20:22:11Z',
    source_url: 'https://global.jaxa.jp/projects/sas/slim/',
  },
];

function outlookResult(both: Array<[string, string]>): ScenarioResult {
  return {
    start: NOW,
    end: '2026-12-15T00:00:00Z',
    step_minutes: 30,
    at_start: {
      sun_visible: false,
      earth_visible: true,
      sun_clearance: -1,
      earth_clearance: 1,
    },
    windows: {
      sun: [],
      earth: [],
      both: both.map(([start, end]) => ({ start, end })),
    },
  } as unknown as ScenarioResult;
}

const idle = {
  isPending: false,
  isError: false,
  data: undefined,
  refetch: vi.fn(),
};

describe('DistanceRow', () => {
  const row = (query: Partial<Parameters<typeof DistanceRow>[0]['query']>) =>
    render(
      <dl>
        <DistanceRow
          label="From this site to the nearest point on Earth's surface"
          note="What it means."
          testId="d"
          query={{
            isPending: false,
            isError: false,
            km: undefined,
            retry: () => {},
            ...query,
          }}
        />
      </dl>,
    );

  it('shows the label, the API value in km and the note', () => {
    row({ km: 395599.36 });
    expect(
      screen.getByText(
        "From this site to the nearest point on Earth's surface",
      ),
    ).toBeTruthy();
    expect(screen.getByTestId('d').textContent).toBe('395,599 km');
    expect(screen.getByText('What it means.')).toBeTruthy();
  });

  it('has loading and error states, and the error can retry', () => {
    row({ isPending: true });
    expect(screen.getByText('loading…')).toBeTruthy();
    cleanup();
    const retry = vi.fn();
    row({ isError: true, retry });
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalled();
  });
});

describe('DepartureList', () => {
  it('lists the API departure times in UTC with the mission and trip length', () => {
    render(
      <DepartureList
        arrivalIso={ARRIVAL}
        departures={DEPARTURES}
        nowMs={Date.parse(NOW)}
      />,
    );
    expect(screen.getByText('Tue, 1 Dec 2026, 12:00 UTC')).toBeTruthy();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]!.textContent).toContain('Fri, 27 Nov 2026, 05:14 UTC');
    expect(items[0]!.textContent).toContain('Apollo 11-style trip, 4.3 days');
    expect(items[0]!.textContent).not.toContain('already past');
    // SLIM's 134.7-day trip would have had to start before "now".
    expect(items[1]!.textContent).toContain('already past');
  });

  it('says so when no mission has a travel time', () => {
    render(<DepartureList arrivalIso={ARRIVAL} departures={[]} nowMs={0} />);
    expect(
      screen.getByText(/No past mission has a known travel time/),
    ).toBeTruthy();
  });
});

describe('GettingThere, when to leave Earth', () => {
  beforeEach(() => {
    hooks.useMissions.mockReturnValue({ ...idle, data: { missions: [] } });
    hooks.useDepartures.mockReturnValue({ ...idle, isPending: true });
  });

  const view = () =>
    render(
      <GettingThere siteId={null} site={{ lat: -89.9, lon: 0 }} nowIso={NOW} />,
    );

  it('waits for the next good window', () => {
    hooks.useSiteOutlook.mockReturnValue({ ...idle, isPending: true });
    view();
    expect(screen.getByText('Finding the next good window…')).toBeTruthy();
    expect(hooks.useDepartures).toHaveBeenLastCalledWith(null);
  });

  it('shows the empty state when there is no good window in range', () => {
    hooks.useSiteOutlook.mockReturnValue({ ...idle, data: outlookResult([]) });
    view();
    expect(screen.getByText(/There is no good window/)).toBeTruthy();
    expect(hooks.useDepartures).toHaveBeenLastCalledWith(null);
  });

  it('asks the API for departures at the next window start and shows them', () => {
    hooks.useSiteOutlook.mockReturnValue({
      ...idle,
      data: outlookResult([[ARRIVAL, '2026-12-03T00:00:00Z']]),
    });
    hooks.useDepartures.mockReturnValue({
      ...idle,
      data: { arrival: ARRIVAL, departures: DEPARTURES },
    });
    view();
    expect(hooks.useDepartures).toHaveBeenLastCalledWith(
      '2026-12-01T12:00:00.000Z',
    );
    expect(screen.getByText(/leave Earth by/)).toBeTruthy();
  });

  it('shows an error with a retry when the departures fail', () => {
    hooks.useSiteOutlook.mockReturnValue({
      ...idle,
      data: outlookResult([[ARRIVAL, '2026-12-03T00:00:00Z']]),
    });
    const refetch = vi.fn();
    hooks.useDepartures.mockReturnValue({
      ...idle,
      isError: true,
      error: new Error('API down'),
      refetch,
    });
    view();
    const leave = screen.getByTestId('leave-earth');
    expect(leave.textContent).toContain('could not reach the Moon Maps API');
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Try again' }).at(-1)!,
    );
    expect(refetch).toHaveBeenCalled();
  });
});
