'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { ChatContext } from '@/lib/api/client';
import { useAssistantChat } from '@/lib/api/hooks';
import { withBackoff } from '@/features/assistant/lib/backoff';
import {
  classifyError,
  isAbort,
  MAX_MESSAGE_CHARS,
  requestMessages,
  type Turn,
} from '@/features/assistant/lib/conversation';
import { EMPTY_THREAD, useSiteChatStore } from './use-site-chat-store';

/** What the request sends as `context`: the site (or spot) and the page's time, so the server adds the site brief. */
export function siteContext(
  siteId: string | null,
  lat: number,
  lon: number,
  timeIso: string,
): ChatContext {
  return siteId ? { site_id: siteId, t: timeIso } : { lat, lon, t: timeIso };
}

function isBusy(key: string): boolean {
  return (
    (useSiteChatStore.getState().threads[key] ?? EMPTY_THREAD).status !== 'idle'
  );
}

/**
 * One site's conversation: send, ask the last question again, stop, start again. Uses the same
 * trimming, error rules and automatic retries (1, 2, 4, 8 s) as the global assistant.
 */
export function useSiteConversation(key: string, context: ChatContext) {
  const { mutateAsync } = useAssistantChat();
  const controller = useRef<AbortController | null>(null);
  /** Bumped by Stop and New chat, so a late answer to an old question is dropped. */
  const generation = useRef(0);
  const contextRef = useRef(context);
  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  const cancel = useCallback(() => {
    generation.current += 1;
    controller.current?.abort();
    controller.current = null;
  }, []);

  // A new site (or leaving the page) stops the question in flight.
  useEffect(() => cancel, [cancel, key]);

  const ask = useCallback(
    async (history: Turn[]) => {
      const messages = requestMessages(history);
      if (!messages) return;
      cancel();
      const mine = generation.current;
      const current = () => generation.current === mine;
      const ctl = new AbortController();
      controller.current = ctl;
      const body = { messages, context: contextRef.current };
      const store = useSiteChatStore.getState();
      try {
        const response = await withBackoff(
          () => {
            if (current()) store.setWaiting(key);
            return mutateAsync({ body, signal: ctl.signal });
          },
          {
            signal: ctl.signal,
            shouldRetry: (e) =>
              !isAbort(e) && classifyError(e).kind === 'retryable',
            onWait: (seconds) => {
              if (current()) store.setRetrying(key, seconds);
            },
          },
        );
        if (current()) store.addAnswer(key, response);
      } catch (e) {
        if (!current() || ctl.signal.aborted || isAbort(e)) return;
        const failure = classifyError(e);
        if (failure.kind === 'retryable')
          store.failLast(key, { kind: 'signal' });
        else store.failLast(key, { kind: 'message', text: failure.message });
      } finally {
        if (controller.current === ctl) controller.current = null;
      }
    },
    [cancel, key, mutateAsync],
  );

  /** Sends a question. Returns false when there is nothing to send or an answer is pending. */
  const send = useCallback(
    (text: string) => {
      const content = text.trim().slice(0, MAX_MESSAGE_CHARS);
      if (!content || isBusy(key)) return false;
      void ask(useSiteChatStore.getState().addQuestion(key, content));
      return true;
    },
    [ask, key],
  );

  /** Asks the last question again: a new answer replaces the last one, or a failed question is sent again. */
  const retry = useCallback(() => {
    if (isBusy(key)) return;
    const turns = useSiteChatStore.getState().prepareRetry(key);
    if (turns) void ask(turns);
  }, [ask, key]);

  /** Stops waiting. The question goes back into the input unless something new was typed there. */
  const stop = useCallback(() => {
    cancel();
    const store = useSiteChatStore.getState();
    const thread = store.threads[key] ?? EMPTY_THREAD;
    if (thread.draft.trim()) {
      store.failLast(key, {
        kind: 'message',
        text: 'Stopped. The question was not answered.',
      });
      return;
    }
    const text = store.takeBackQuestion(key);
    if (text) store.setDraft(key, text);
  }, [cancel, key]);

  const reset = useCallback(() => {
    cancel();
    useSiteChatStore.getState().clear(key);
  }, [cancel, key]);

  return { send, retry, stop, reset };
}
