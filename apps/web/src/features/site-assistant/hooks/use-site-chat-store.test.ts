import { beforeEach, describe, expect, it } from 'vitest';
import { EMPTY_THREAD, siteKey, useSiteChatStore } from './use-site-chat-store';

const answer = (reply: string) => ({
  reply,
  sources: [],
  tools_used: [],
  app_link: null,
  model: null,
});

const store = () => useSiteChatStore.getState();
const thread = (key: string) => store().threads[key] ?? EMPTY_THREAD;

describe('siteKey', () => {
  it('uses the site id, or the coordinates of a custom spot', () => {
    expect(siteKey('haworth', 0, 0)).toBe('site:haworth');
    expect(siteKey(null, -89.12345, 10)).toBe('spot:-89.1235,10.0000');
  });
});

describe('useSiteChatStore', () => {
  beforeEach(() => useSiteChatStore.setState({ threads: {} }));

  it('keeps a separate conversation per site', () => {
    store().addQuestion('site:a', 'Question about A');
    store().addQuestion('site:b', 'Question about B');
    store().setDraft('site:a', 'draft A');
    expect(thread('site:a').turns.map((t) => t.content)).toEqual([
      'Question about A',
    ]);
    expect(thread('site:b').turns.map((t) => t.content)).toEqual([
      'Question about B',
    ]);
    expect(thread('site:b').draft).toBe('');
    expect(thread('site:c')).toBe(EMPTY_THREAD);
  });

  it('marks a fresh answer until it is typed out', () => {
    store().addQuestion('site:a', 'Q');
    store().setWaiting('site:a');
    store().addAnswer('site:a', answer('A'));
    const t = thread('site:a');
    expect(t.status).toBe('idle');
    expect(t.freshId).toBe(t.turns.at(-1)!.id);
    store().settle('site:a');
    expect(thread('site:a').freshId).toBeNull();
  });

  it('prepares a retry by dropping the last answer', () => {
    store().addQuestion('site:a', 'Q1');
    store().addAnswer('site:a', answer('A1'));
    store().addQuestion('site:a', 'Q2');
    store().addAnswer('site:a', answer('A2'));
    const turns = store().prepareRetry('site:a')!;
    expect(turns.map((t) => t.content)).toEqual(['Q1', 'A1', 'Q2']);
    expect(thread('site:a').turns).toHaveLength(3);
  });

  it('retries a question that was not sent', () => {
    store().addQuestion('site:a', 'Q');
    store().failLast('site:a', { kind: 'signal' });
    expect(thread('site:a').turns[0]).toMatchObject({ failed: true });
    const turns = store().prepareRetry('site:a')!;
    expect(turns[0]).toMatchObject({ failed: false });
    expect(thread('site:a').notice).toBeNull();
  });

  it('has nothing to retry in an empty conversation', () => {
    expect(store().prepareRetry('site:a')).toBeNull();
  });

  it('takes back an unanswered question', () => {
    store().addQuestion('site:a', 'Q');
    expect(store().takeBackQuestion('site:a')).toBe('Q');
    expect(thread('site:a').turns).toEqual([]);
  });

  it('clears one site and keeps the others', () => {
    store().addQuestion('site:a', 'Q');
    store().addQuestion('site:b', 'Q');
    store().clear('site:a');
    expect(thread('site:a').turns).toEqual([]);
    expect(thread('site:b').turns).toHaveLength(1);
  });
});
