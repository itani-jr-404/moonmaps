'use client';

import { create } from 'zustand';
import type { ChatResponse } from '@/lib/api/client';
import { MAX_MESSAGE_CHARS, type Turn } from '../lib/conversation';

/** waiting: a request is out. retrying: counting down to an automatic retry. */
export type ChatStatus = 'idle' | 'waiting' | 'retrying';
export type ChatTab = 'chat' | 'resources';
/** lost: the last request got no answer at all, or the assistant is unavailable (503). */
export type LinkStatus = 'ok' | 'lost';
/**
 * The strip at the top of the log. signal: no answer after every automatic retry (shown as
 * "Signal lost" with a Retry button). message: a sentence from the API or a fixed one.
 */
export type ChatNotice = { kind: 'signal' } | { kind: 'message'; text: string };

type ChatState = {
  open: boolean;
  /** True once the panel has been opened in this visit; the floating pills then stay hidden. */
  opened: boolean;
  pillsDismissed: boolean;
  tab: ChatTab;
  turns: Turn[];
  /** The text in the input, kept here so it survives closing and reopening the panel. */
  draft: string;
  status: ChatStatus;
  notice: ChatNotice | null;
  /** Seconds before the next automatic retry, while status is "retrying". */
  retryIn: number | null;
  link: LinkStatus;
  /** Answers that arrived while the panel was closed. */
  unread: number;

  setOpen: (open: boolean) => void;
  dismissPills: () => void;
  setTab: (tab: ChatTab) => void;
  setDraft: (draft: string) => void;
  addQuestion: (content: string) => Turn[];
  /** Adds an answer. Returns true when it arrived while the panel was closed. */
  addAnswer: (response: ChatResponse) => boolean;
  setWaiting: () => void;
  setRetrying: (seconds: number) => void;
  setLink: (link: LinkStatus) => void;
  /** The last question could not be sent: mark it and show the notice. */
  failLast: (notice: ChatNotice) => void;
  /** Takes back the unanswered last question and returns its text. */
  takeBackQuestion: (notice?: ChatNotice | null) => string | null;
  /** Clears the "not sent" mark of the last question, before a retry. */
  unfailLast: () => Turn[];
  clear: () => void;
};

let nextId = 1;

/**
 * The conversation and the panel's state, in memory only. Nothing is written to localStorage or
 * sent anywhere except with the next question, and a reload starts a new conversation.
 */
export const useChatStore = create<ChatState>((set, get) => ({
  open: false,
  opened: false,
  pillsDismissed: false,
  tab: 'chat',
  turns: [],
  draft: '',
  status: 'idle',
  notice: null,
  retryIn: null,
  link: 'ok',
  unread: 0,

  setOpen: (open) => set(open ? { open, opened: true, unread: 0 } : { open }),
  dismissPills: () => set({ pillsDismissed: true }),
  setTab: (tab) => set({ tab }),
  setDraft: (draft) => set({ draft: draft.slice(0, MAX_MESSAGE_CHARS) }),
  addQuestion: (content) => {
    const turns: Turn[] = [
      ...get().turns,
      { id: nextId++, role: 'user', content, at: Date.now() },
    ];
    set({ turns });
    return turns;
  },
  addAnswer: (response) => {
    const unseen = !get().open;
    set((s) => ({
      status: 'idle',
      notice: null,
      retryIn: null,
      link: 'ok',
      unread: unseen ? s.unread + 1 : s.unread,
      turns: [
        ...s.turns,
        {
          id: nextId++,
          role: 'assistant',
          content: response.reply,
          at: Date.now(),
          sources: response.sources,
          appLink: response.app_link ?? null,
        },
      ],
    }));
    return unseen;
  },
  setWaiting: () => set({ status: 'waiting', notice: null, retryIn: null }),
  setRetrying: (seconds) =>
    set({ status: 'retrying', retryIn: seconds, link: 'lost' }),
  setLink: (link) => set({ link }),
  failLast: (notice) =>
    set((s) => ({
      status: 'idle',
      retryIn: null,
      notice,
      turns: s.turns.map((t, i) =>
        i === s.turns.length - 1 && t.role === 'user'
          ? { ...t, failed: true }
          : t,
      ),
    })),
  takeBackQuestion: (notice = null) => {
    const { turns } = get();
    const last = turns.at(-1);
    set({ status: 'idle', retryIn: null, notice });
    if (last?.role !== 'user') return null;
    set({ turns: turns.slice(0, -1) });
    return last.content;
  },
  unfailLast: () => {
    const turns = get().turns.map((t, i, all) =>
      i === all.length - 1 && t.role === 'user' ? { ...t, failed: false } : t,
    );
    set({ turns });
    return turns;
  },
  clear: () =>
    set({
      turns: [],
      status: 'idle',
      notice: null,
      retryIn: null,
      tab: 'chat',
    }),
}));
