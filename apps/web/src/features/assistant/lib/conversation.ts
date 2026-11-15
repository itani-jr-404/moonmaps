import {
  ApiError,
  errorMessage,
  type AppLink,
  type ChatContext,
  type ChatMessage,
  type ChatSource,
} from '@/lib/api/client';
import type { Place } from '@/lib/state/scenario-store';

/**
 * Limits of POST /assistant/chat, the same values as MAX_MESSAGES and MAX_MESSAGE_CHARS in
 * apps/api/app/schemas/assistant.py. The API refuses a request past them with `invalid_input`.
 */
export const MAX_MESSAGES = 20;
export const MAX_MESSAGE_CHARS = 2000;
/** The character counter under the input appears past this length. */
export const COUNTER_FROM = 1800;

export type UserTurn = {
  id: number;
  role: 'user';
  content: string;
  /** When it was asked (ms since 1970, UTC). */
  at: number;
  /** True when the question could not be sent; it is shown dimmed and left out of the history. */
  failed?: boolean;
};
export type AssistantTurn = {
  id: number;
  role: 'assistant';
  content: string;
  /** When the answer arrived (ms since 1970, UTC). */
  at: number;
  sources: ChatSource[];
  appLink: AppLink | null;
};
export type Turn = UserTurn | AssistantTurn;

/**
 * The messages to send: at most the last MAX_MESSAGES turns, each cut to MAX_MESSAGE_CHARS (an
 * answer can be longer than a question may be), with empty and unsent ones left out. When the cut
 * leaves an answer first, that answer is dropped too, so the history starts with a question.
 * Null when the last turn is not the user's, because the API only answers a user's message.
 */
export function requestMessages(turns: readonly Turn[]): ChatMessage[] | null {
  const messages = turns
    .filter((t) => !(t.role === 'user' && t.failed))
    .map((t) => ({
      role: t.role,
      content: t.content.trim().slice(0, MAX_MESSAGE_CHARS),
    }))
    .filter((m) => m.content.length > 0)
    .slice(-MAX_MESSAGES);
  while (messages.length > 0 && messages[0]!.role !== 'user') messages.shift();
  return messages.at(-1)?.role === 'user' ? messages : null;
}

/** What is on screen in the planner, so the assistant can explain it. */
export function chatContext(place: Place, timeMs: number): ChatContext {
  const t = new Date(timeMs).toISOString();
  return place.kind === 'site'
    ? { site_id: place.id, t }
    : { lat: place.lat, lon: place.lon, t };
}

/** The planner place and time for an answer's "Show in the planner" button. */
export function plannerTarget(link: AppLink): {
  place: Place;
  timeMs: number | null;
} {
  const place: Place = link.site_id
    ? { kind: 'site', id: link.site_id }
    : { kind: 'point', lat: link.lat, lon: link.lon };
  const t = Date.parse(link.t);
  return { place, timeMs: Number.isFinite(t) ? t : null };
}

/** An answer's sources without repeats (two tools can share a title), in their first order. */
export function uniqueSources(sources: readonly ChatSource[]): ChatSource[] {
  return sources.filter(
    (s, i, all) => all.findIndex((o) => o.title === s.title) === i,
  );
}

export const UNAVAILABLE_MESSAGE =
  'The assistant is not available right now. The rest of Moon Maps still works.';

export type ChatFailure = {
  /**
   * unavailable: 503 assistant_unavailable, no automatic retry.
   * rate_limited: 429, the question goes back into the input.
   * retryable: no answer at all, or a 5xx; retried automatically with backoff.
   * other: any other API error (for example invalid_input).
   */
  kind: 'unavailable' | 'rate_limited' | 'retryable' | 'other';
  message: string;
};

export function classifyError(error: unknown): ChatFailure {
  if (error instanceof ApiError) {
    if (error.code === 'assistant_unavailable')
      return { kind: 'unavailable', message: UNAVAILABLE_MESSAGE };
    if (error.code === 'rate_limited' || error.status === 429)
      return { kind: 'rate_limited', message: error.message };
    if (error.code === 'network' || (error.status ?? 0) >= 500)
      return { kind: 'retryable', message: retryableMessage(error) };
    return { kind: 'other', message: error.message };
  }
  return { kind: 'retryable', message: errorMessage(error) };
}

function retryableMessage(error: ApiError): string {
  return error.code === 'network'
    ? 'The assistant did not answer. Please try again.'
    : error.message;
}

/** True when a request ended because the user pressed Stop (or the conversation was cleared). */
export function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export type FollowUp = { label: string; text: string };

/** Follow-up questions offered as text links under the latest answer. */
export const FOLLOW_UPS: readonly FollowUp[] = [
  { label: 'Explain more simply', text: 'Can you explain that more simply?' },
  {
    label: 'Is this spot good now?',
    text: 'Is the spot on screen good for landing right now?',
  },
];

/** The launcher's unread count, capped so it fits in the status light. */
export function badgeText(unread: number): string {
  return unread > 9 ? '9+' : String(unread);
}

/** Questions floating next to the launcher before the panel is first opened (at most two). */
export const FLOATING_QUESTIONS = [
  'Is this spot good right now?',
  'How do I use Moon Maps?',
] as const;

/** The suggested questions listed under the welcome block. */
export const SUGGESTED_QUESTIONS = [
  'How do I pick a landing spot?',
  'Is this spot good right now?',
  'What does Earthrise mean?',
] as const;

/** Sent by the welcome block's "Best dates this month" card. */
export const BEST_DATES_QUESTION =
  'What are the best landing dates in the next 30 days for the spot on screen?';

/** "09:41 UTC". */
export function fmtUtcClock(ms: number): string {
  return `${new Date(ms).toISOString().slice(11, 16)} UTC`;
}

/** "2026-11-20 00:00 UTC". */
export function fmtUtcDateTime(ms: number): string {
  const iso = new Date(ms).toISOString();
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
}

/** "87.45°S 4.10°W": two decimals, hemisphere letters instead of signs. */
export function fmtLatLon(lat: number, lon: number): string {
  const part = (v: number, pos: string, neg: string) =>
    `${Math.abs(v).toFixed(2)}°${v < 0 ? neg : pos}`;
  return `${part(lat, 'N', 'S')} ${part(lon, 'E', 'W')}`;
}
