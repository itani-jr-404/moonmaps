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
