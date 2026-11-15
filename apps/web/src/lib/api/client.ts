import createClient from 'openapi-fetch';
import type { components, paths } from '@moon-maps/contracts';

/** Types of the API, generated from packages/contracts. Never redeclare them by hand. */
export type Schemas = components['schemas'];
export type Site = Schemas['Site'];
export type Scenario = Schemas['Scenario'];
export type ScenarioResult = Schemas['ScenarioResult'];
export type SkyResponse = Schemas['SkyResponse'];
export type SceneResponse = Schemas['SceneResponse'];
export type ValidationReport = Schemas['ValidationReport'];
export type ApiErrorBody = Schemas['ErrorResponse'];
export type ChatMessage = Schemas['ChatMessage'];
export type ChatContext = Schemas['ChatContext'];
export type ChatRequest = Schemas['ChatRequest'];
export type ChatResponse = Schemas['ChatResponse'];
export type ChatSource = Schemas['ChatSource'];
export type AppLink = Schemas['AppLink'];

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

/** The only place in the web app that talks to the network. */
export const api = createClient<paths>({ baseUrl: API_URL });

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    /** The HTTP status, when the API answered at all. */
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Turns an openapi-fetch result into data or a thrown ApiError, for TanStack Query. */
export function unwrap<T>(result: {
  data?: T;
  error?: unknown;
  response: Response;
}): T {
  if (result.data !== undefined) return result.data;
  const body = result.error as Partial<ApiErrorBody> | undefined;
  throw new ApiError(
    body?.error?.code ?? 'network',
    body?.error?.message ??
      `The Moon Maps API answered ${result.response.status}.`,
    result.response.status,
  );
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'We could not reach the Moon Maps API. Check your connection and try again.';
}
