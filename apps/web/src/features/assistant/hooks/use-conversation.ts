'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAssistantChat } from '@/lib/api/hooks';
import { useScenarioStore } from '@/lib/state/scenario-store';
import { withBackoff } from '../lib/backoff';
import { playChime } from '../lib/chime';
import {
  chatContext,
  classifyError,
  isAbort,
  MAX_MESSAGE_CHARS,
  requestMessages,
  type Turn,
} from '../lib/conversation';
import { useChatStore } from './use-chat-store';

/**
 * The assistant conversation: send a question with the place and time on screen, retry a failed
 * one (automatically with backoff when the API could not answer at all), stop one that takes too
 * long, or start again.
 */
export function useConversation() {
  const { mutateAsync } = useAssistantChat();
  const controller = useRef<AbortController | null>(null);
  /** Bumped by Stop and New chat, so a late answer to an old question is dropped. */
  const generation = useRef(0);

  const cancel = useCallback(() => {
    generation.current += 1;
    controller.current?.abort();
    controller.current = null;
  }, []);

  useEffect(() => cancel, [cancel]);

  const ask = useCallback(
    async (history: Turn[]) => {
      const messages = requestMessages(history);
      if (!messages) return;
      cancel();
      const mine = generation.current;
      const current = () => generation.current === mine;
      const ctl = new AbortController();
      controller.current = ctl;
      const { place, timeMs } = useScenarioStore.getState();
      const body = { messages, context: chatContext(place, timeMs) };
      const store = useChatStore.getState();
      try {
        const response = await withBackoff(
          () => {
            if (current()) store.setWaiting();
            return mutateAsync({ body, signal: ctl.signal });
          },
          {
            signal: ctl.signal,
            shouldRetry: (e) =>
              !isAbort(e) && classifyError(e).kind === 'retryable',
            onWait: (seconds) => {
              if (current()) store.setRetrying(seconds);
            },
          },
        );
        if (current() && store.addAnswer(response)) playChime();
      } catch (e) {
        if (!current() || ctl.signal.aborted || isAbort(e)) return;
        const failure = classifyError(e);
        store.setLink(
          failure.kind === 'unavailable' || failure.kind === 'retryable'
            ? 'lost'
            : 'ok',
        );
        if (failure.kind === 'retryable') store.failLast({ kind: 'signal' });
        else if (
          failure.kind === 'rate_limited' &&
          !useChatStore.getState().draft.trim()
        ) {
          // The question goes back into the input, to send again after the wait.
          const text = store.takeBackQuestion({
            kind: 'message',
            text: failure.message,
          });
          if (text) store.setDraft(text);
        } else store.failLast({ kind: 'message', text: failure.message });
      } finally {
        if (controller.current === ctl) controller.current = null;
      }
    },
    [cancel, mutateAsync],
  );

  /** Sends a question. Returns false when there is nothing to send or an answer is pending. */
  const send = useCallback(
    (text: string) => {
      const content = text.trim().slice(0, MAX_MESSAGE_CHARS);
      const store = useChatStore.getState();
      if (!content || store.status !== 'idle') return false;
      void ask(store.addQuestion(content));
      return true;
    },
    [ask],
  );

  const retry = useCallback(() => {
    const store = useChatStore.getState();
    const last = store.turns.at(-1);
    if (store.status !== 'idle' || last?.role !== 'user' || !last.failed)
      return;
    void ask(store.unfailLast());
  }, [ask]);

  /** Stops waiting. The question goes back into the input unless something new was typed there. */
  const stop = useCallback(() => {
    cancel();
    const store = useChatStore.getState();
    if (store.draft.trim()) {
      store.failLast({
        kind: 'message',
        text: 'Stopped. The question was not answered.',
      });
      return;
    }
    const text = store.takeBackQuestion();
    if (text) store.setDraft(text);
  }, [cancel]);

  const reset = useCallback(() => {
    cancel();
    useChatStore.getState().clear();
  }, [cancel]);

  return { send, retry, stop, reset };
}
