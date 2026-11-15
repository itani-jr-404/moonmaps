'use client';

import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { api, unwrap, type ChatRequest, type Scenario } from './client';

const HOUR = 3_600_000;

export function useSites() {
  return useQuery({
    queryKey: ['sites'],
    queryFn: async ({ signal }) => unwrap(await api.GET('/sites', { signal })),
    staleTime: Infinity,
  });
}

export function useAnalyze(scenarios: Scenario[] | null) {
  return useQuery({
    queryKey: ['analyze', scenarios],
    queryFn: async ({ signal }) =>
      unwrap(
        await api.POST('/analyze', { body: { scenarios: scenarios! }, signal }),
      ).results,
    enabled: scenarios !== null && scenarios.length > 0,
    placeholderData: keepPreviousData,
    staleTime: HOUR,
  });
}

/** The Sun and the Earth seen from one point at one moment. */
export function useSky(
  point: { lat: number; lon: number } | null,
  timeIso: string | null,
) {
  return useQuery({
    queryKey: ['sky', point?.lat, point?.lon, timeIso],
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/sky', {
          params: {
            query: {
              lat: point!.lat,
              lon: point!.lon,
              t: timeIso ?? undefined,
            },
          },
          signal,
        }),
      ),
    enabled: point !== null,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useScene(timeIso: string | null) {
  return useQuery({
    queryKey: ['scene', timeIso],
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET('/scene', {
          params: { query: { t: timeIso ?? undefined } },
          signal,
        }),
      ),
    staleTime: 10 * 60_000,
  });
}

export function useValidation() {
  return useQuery({
    queryKey: ['validation'],
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/validation', { signal })),
    staleTime: Infinity,
  });
}

/**
 * One turn of the assistant chat (POST /assistant/chat). The browser keeps the conversation and
 * sends it whole each time; the server stores nothing. Pass `signal` to let the user stop a turn.
 */
export function useAssistantChat() {
  return useMutation({
    mutationFn: async ({
      body,
      signal,
    }: {
      body: ChatRequest;
      signal?: AbortSignal;
    }) => unwrap(await api.POST('/assistant/chat', { body, signal })),
    retry: false,
  });
}

/**
 * One site over the coming days (POST /analyze for a single scenario), for the site page
 * and the globe's "good again from" line. `startIso` should be rounded so that the cache
 * key stays the same between renders.
 */
export function useSiteOutlook(
  site: { id: string } | { lat: number; lon: number } | null,
  startIso: string,
  days: number,
  includeSeries: boolean,
) {
  return useQuery({
    queryKey: ['site-outlook', site, startIso, days, includeSeries],
    queryFn: async ({ signal }) => {
      const start = Date.parse(startIso);
      const { results } = unwrap(
        await api.POST('/analyze', {
          body: {
            scenarios: [
              {
                site: site!,
                start: startIso,
                end: new Date(start + days * 24 * HOUR).toISOString(),
                step_minutes: 30,
                include_series: includeSeries,
              },
            ],
          },
          signal,
        }),
      );
      const result = results[0];
      if (!result) throw new Error('The API returned no result.');
      return result;
    },
    enabled: site !== null,
    staleTime: HOUR,
  });
}

/** Past landings with launch and landing times and travel times (GET /missions). */
export function useMissions() {
  return useQuery({
    queryKey: ['missions'],
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/missions', { signal })),
    staleTime: Infinity,
  });
}

/** Error rates and learning from past landings (GET /accuracy), read from saved comparison files. */
export function useAccuracy() {
  return useQuery({
    queryKey: ['accuracy'],
    queryFn: async ({ signal }) =>
      unwrap(await api.GET('/accuracy', { signal })),
    staleTime: Infinity,
  });
}
