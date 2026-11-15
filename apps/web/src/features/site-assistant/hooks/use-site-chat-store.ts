'use client';

import { create } from 'zustand';
import type { ChatResponse } from '@/lib/api/client';
import type {
  ChatNotice,
  ChatStatus,
} from '@/features/assistant/hooks/use-chat-store';
import {
  MAX_MESSAGE_CHARS,
  type Turn,
} from '@/features/assistant/lib/conversation';

/** One site's conversation. */
export type SiteThread = {
  turns: Turn[];
  draft: string;
  status: ChatStatus;
  notice: ChatNotice | null;
  /** Seconds before the next automatic retry, while status is "retrying". */
  retryIn: number | null;
  /** The answer that has just arrived and is still being typed out, if any. */
  freshId: number | null;
};

export const EMPTY_THREAD: SiteThread = {
  turns: [],
  draft: '',
  status: 'idle',
  notice: null,
  retryIn: null,
  freshId: null,
};

/** The key of a site's conversation: its id, or its coordinates for a custom spot. */
export function siteKey(siteId: string | null, lat: number, lon: number) {
  return siteId ? `site:${siteId}` : `spot:${lat.toFixed(4)},${lon.toFixed(4)}`;
}

type SiteChatState = {
  threads: Record<string, SiteThread>;
  setDraft: (key: string, draft: string) => void;
  addQuestion: (key: string, content: string) => Turn[];
  addAnswer: (key: string, response: ChatResponse) => void;
  setWaiting: (key: string) => void;
  setRetrying: (key: string, seconds: number) => void;
  /** The last question could not be answered: mark it and show the notice. */
  failLast: (key: string, notice: ChatNotice) => void;
  /** Takes back the unanswered last question and returns its text. */
  takeBackQuestion: (key: string, notice?: ChatNotice | null) => string | null;
  /**
   * Gets the history ready to ask the last question again: drops the answer after it, if any,
   * and clears its "not sent" mark. Null when there is no question to ask again.
   */
  prepareRetry: (key: string) => Turn[] | null;
  /** The fresh answer has been typed out. */
  settle: (key: string) => void;
  clear: (key: string) => void;
};

let nextId = 1;

/**
 * The site assistant's conversations, one per site, in memory only and separate from the global
 * assistant's. A reload starts again; nothing is written to localStorage.
 */
export const useSiteChatStore = create<SiteChatState>((set, get) => {
  const thread = (key: string) => get().threads[key] ?? EMPTY_THREAD;
  const patch = (key: string, change: Partial<SiteThread>) =>
    set((s) => ({
      threads: {
        ...s.threads,
        [key]: { ...(s.threads[key] ?? EMPTY_THREAD), ...change },
      },
    }));

  return {
    threads: {},
    setDraft: (key, draft) =>
      patch(key, { draft: draft.slice(0, MAX_MESSAGE_CHARS) }),
    addQuestion: (key, content) => {
      const turns: Turn[] = [
        ...thread(key).turns,
        { id: nextId++, role: 'user', content, at: Date.now() },
      ];
      patch(key, { turns });
      return turns;
    },
    addAnswer: (key, response) => {
      const id = nextId++;
      patch(key, {
        status: 'idle',
        notice: null,
        retryIn: null,
        freshId: id,
        turns: [
          ...thread(key).turns,
          {
            id,
            role: 'assistant',
            content: response.reply,
            at: Date.now(),
            sources: response.sources,
            appLink: response.app_link ?? null,
          },
        ],
      });
    },
    setWaiting: (key) =>
      patch(key, { status: 'waiting', notice: null, retryIn: null }),
    setRetrying: (key, seconds) =>
      patch(key, { status: 'retrying', retryIn: seconds }),
    failLast: (key, notice) =>
      patch(key, {
        status: 'idle',
        retryIn: null,
        notice,
        turns: thread(key).turns.map((t, i, all) =>
          i === all.length - 1 && t.role === 'user'
            ? { ...t, failed: true }
            : t,
        ),
      }),
    takeBackQuestion: (key, notice = null) => {
      const { turns } = thread(key);
      const last = turns.at(-1);
      patch(key, { status: 'idle', retryIn: null, notice });
      if (last?.role !== 'user') return null;
      patch(key, { turns: turns.slice(0, -1) });
      return last.content;
    },
    prepareRetry: (key) => {
      let turns = thread(key).turns;
      if (turns.at(-1)?.role === 'assistant') turns = turns.slice(0, -1);
      if (turns.at(-1)?.role !== 'user') return null;
      turns = turns.map((t, i, all) =>
        i === all.length - 1 && t.role === 'user' ? { ...t, failed: false } : t,
      );
      patch(key, { turns, notice: null, freshId: null });
      return turns;
    },
    settle: (key) => {
      if (thread(key).freshId !== null) patch(key, { freshId: null });
    },
    clear: (key) => patch(key, { ...EMPTY_THREAD, draft: thread(key).draft }),
  };
});
