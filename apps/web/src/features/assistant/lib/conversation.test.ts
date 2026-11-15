import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api/client';
import {
  badgeText,
  FOLLOW_UPS,
  fmtLatLon,
  fmtUtcClock,
  fmtUtcDateTime,
  FLOATING_QUESTIONS,
  SUGGESTED_QUESTIONS,
  chatContext,
  classifyError,
  isAbort,
  MAX_MESSAGE_CHARS,
  MAX_MESSAGES,
  plannerTarget,
  requestMessages,
  UNAVAILABLE_MESSAGE,
  type Turn,
} from './conversation';

let id = 0;
const user = (content: string): Turn => ({
  id: ++id,
  role: 'user',
  content,
  at: 0,
});
const bot = (content: string): Turn => ({
  id: ++id,
  role: 'assistant',
  content,
  at: 0,
  sources: [],
  appLink: null,
});

describe('requestMessages', () => {
  it('sends roles and text only', () => {
    expect(requestMessages([user('Hi'), bot('Hello'), user('Why?')])).toEqual([
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello' },
      { role: 'user', content: 'Why?' },
    ]);
  });

  it('keeps only the last 20 messages', () => {
    const turns = Array.from({ length: 25 }, (_, i) => user(`m${i}`));
    const sent = requestMessages(turns)!;
    expect(sent).toHaveLength(MAX_MESSAGES);
    expect(sent[0]).toEqual({ role: 'user', content: 'm5' });
    expect(sent.at(-1)).toEqual({ role: 'user', content: 'm24' });
  });

  it('starts the history with a question when the cut leaves an answer first', () => {
    const turns: Turn[] = [];
    for (let i = 0; i < 15; i++) turns.push(user(`q${i}`), bot(`a${i}`));
    turns.push(user('last'));
    const sent = requestMessages(turns)!;
    expect(sent).toHaveLength(MAX_MESSAGES - 1);
    expect(sent[0]).toEqual({ role: 'user', content: 'q6' });
    expect(sent.at(-1)).toEqual({ role: 'user', content: 'last' });
  });

  it('cuts a long answer to the request limit', () => {
    const sent = requestMessages([
      user('q'),
      bot('x'.repeat(3000)),
      user('q2'),
    ])!;
    expect(sent[1]!.content).toHaveLength(MAX_MESSAGE_CHARS);
  });

  it('leaves out questions that were not sent', () => {
    const failed: Turn = {
      id: ++id,
      role: 'user',
      content: 'lost',
      at: 0,
      failed: true,
    };
    expect(requestMessages([failed, user('Again')])).toEqual([
      { role: 'user', content: 'Again' },
    ]);
  });

  it('leaves out empty messages', () => {
    expect(requestMessages([user('  '), user('Real')])).toEqual([
      { role: 'user', content: 'Real' },
    ]);
  });

  it('returns null unless the last message is the user’s', () => {
    expect(requestMessages([user('q'), bot('a')])).toBeNull();
    expect(requestMessages([])).toBeNull();
  });
});

describe('chatContext', () => {
  const t = Date.parse('2026-11-20T00:00:00Z');
  it('sends a site id for a curated site', () => {
    expect(chatContext({ kind: 'site', id: 'haworth' }, t)).toEqual({
      site_id: 'haworth',
      t: '2026-11-20T00:00:00.000Z',
    });
  });
  it('sends coordinates for a point', () => {
    expect(chatContext({ kind: 'point', lat: -89.45, lon: -137.3 }, t)).toEqual(
      { lat: -89.45, lon: -137.3, t: '2026-11-20T00:00:00.000Z' },
    );
  });
});

describe('plannerTarget', () => {
  it('prefers the site id', () => {
    expect(
      plannerTarget({
        site_id: 'haworth',
        lat: -87.4,
        lon: -4.1,
        t: '2026-12-01T12:00:00Z',
      }),
    ).toEqual({
      place: { kind: 'site', id: 'haworth' },
      timeMs: Date.parse('2026-12-01T12:00:00Z'),
    });
  });
  it('falls back to the point', () => {
    expect(
      plannerTarget({ lat: -89.5, lon: 10, t: '2026-12-01T12:00:00Z' }).place,
    ).toEqual({ kind: 'point', lat: -89.5, lon: 10 });
  });
});

describe('classifyError', () => {
  it('does not retry when the assistant is unavailable, and uses fixed words', () => {
    expect(
      classifyError(new ApiError('assistant_unavailable', 'No key', 503)),
    ).toEqual({ kind: 'unavailable', message: UNAVAILABLE_MESSAGE });
  });
  it('keeps the API’s message when rate limited', () => {
    expect(
      classifyError(
        new ApiError('rate_limited', 'Please wait 12 seconds.', 429),
      ),
    ).toEqual({ kind: 'rate_limited', message: 'Please wait 12 seconds.' });
  });
  it('retries a network failure and any other 5xx', () => {
    expect(classifyError(new TypeError('Failed to fetch')).kind).toBe(
      'retryable',
    );
    expect(classifyError(new ApiError('internal', 'Oops', 500)).kind).toBe(
      'retryable',
    );
    expect(
      classifyError(new ApiError('network', 'Bad gateway', 502)).kind,
    ).toBe('retryable');
  });
  it('does not retry invalid input', () => {
    expect(
      classifyError(new ApiError('invalid_input', 'Too long', 422)),
    ).toEqual({ kind: 'other', message: 'Too long' });
  });
});

describe('follow-ups and suggestions', () => {
  it('offers two follow-up questions as short labels', () => {
    expect(FOLLOW_UPS.map((f) => f.label)).toEqual([
      'Explain more simply',
      'Is this spot good now?',
    ]);
  });
  it('floats at most two questions and lists three suggestions', () => {
    expect(FLOATING_QUESTIONS.length).toBeLessThanOrEqual(2);
    expect(SUGGESTED_QUESTIONS).toHaveLength(3);
  });
});

describe('UTC and coordinate formats', () => {
  const t = Date.parse('2026-11-20T09:41:30Z');
  it('shows times in UTC', () => {
    expect(fmtUtcClock(t)).toBe('09:41 UTC');
    expect(fmtUtcDateTime(t)).toBe('2026-11-20 09:41 UTC');
  });
  it('shows coordinates to 2 decimals with hemisphere letters', () => {
    expect(fmtLatLon(-86.8, -22)).toBe('86.80°S 22.00°W');
    expect(fmtLatLon(1.234, 31)).toBe('1.23°N 31.00°E');
  });
});

describe('badgeText', () => {
  it('caps the unread count at 9+', () => {
    expect(badgeText(1)).toBe('1');
    expect(badgeText(9)).toBe('9');
    expect(badgeText(10)).toBe('9+');
  });
});

describe('isAbort', () => {
  it('recognises an aborted request only', () => {
    expect(isAbort(new DOMException('stop', 'AbortError'))).toBe(true);
    expect(isAbort(new Error('other'))).toBe(false);
  });
});
