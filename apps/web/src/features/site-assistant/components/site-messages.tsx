'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { OrbitIcon } from '@/components/ui/icons';
import { ReplyBody } from '@/features/assistant/components/log-entry';
import {
  plannerTarget,
  uniqueSources,
  type AssistantTurn,
  type UserTurn,
} from '@/features/assistant/lib/conversation';
import { replyBlocks } from '@/features/assistant/lib/reply-blocks';
import { scenarioQuery } from '@/lib/state/url-sync';
import { useTypeOut } from '../hooks/use-type-out';
import type { SiteThread } from '../hooks/use-site-chat-store';
import type { Suggestion } from '../lib/suggestions';
import styles from './site-assistant.module.css';

/** The conversation: the greeting and suggestions while empty, then questions and answers. */
export function SiteMessages({
  name,
  thread,
  reduced,
  suggestions,
  onAsk,
  onRetry,
  onSettle,
}: {
  name: string;
  thread: SiteThread;
  reduced: boolean;
  suggestions: Suggestion[];
  onAsk: (text: string) => void;
  onRetry: () => void;
  onSettle: () => void;
}) {
  const { turns, status, notice, retryIn, freshId } = thread;
  const busy = status !== 'idle';
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastAnswer = [...turns].reverse().find((t) => t.role === 'assistant');
  const last = turns.at(-1);

  // Keeps the newest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
  }, [turns.length, status]);

  return (
    <div ref={scrollRef} className={styles.scroll}>
      {turns.length === 0 && !busy ? (
        <div className={styles.empty}>
          <span className={styles.emptyMark} aria-hidden="true">
            <OrbitIcon />
          </span>
          <p className={styles.greeting}>
            What would you like to know about {name}?
          </p>
          <div
            className={styles.suggestions}
            role="group"
            aria-label="Suggested questions"
          >
            {suggestions.map((s) => (
              <button
                key={s.label}
                type="button"
                className={styles.suggestion}
                onClick={() => onAsk(s.text)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ol className={styles.log} aria-label="Conversation">
          {turns.map((t) =>
            t.role === 'user' ? (
              <Question key={t.id} turn={t} />
            ) : (
              <Answer
                key={t.id}
                turn={t}
                fresh={t.id === freshId}
                reduced={reduced}
                canRetry={!busy && t === lastAnswer && last === t}
                onRetry={onRetry}
                onSettle={onSettle}
              />
            ),
          )}
          {busy ? (
            <li className={styles.thinking}>
              <span className={styles.thinkingMark} aria-hidden="true">
                <OrbitIcon />
              </span>
              <p role="status">
                {status === 'retrying' && retryIn !== null
                  ? `No answer yet. Trying again in ${retryIn} s…`
                  : 'Thinking…'}
              </p>
            </li>
          ) : null}
        </ol>
      )}

      {notice && !busy ? (
        <div className={styles.notice} role="alert">
          <span>
            {notice.kind === 'signal'
              ? 'The assistant did not answer. Please try again.'
              : notice.text}
          </span>
          {last?.role === 'user' ? (
            <button type="button" className={styles.textBtn} onClick={onRetry}>
              Retry
            </button>
          ) : null}
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {lastAnswer ? `Answer: ${lastAnswer.content}` : ''}
      </p>
    </div>
  );
}

function Question({ turn }: { turn: UserTurn }) {
  return (
    <li
      className={styles.question}
      data-failed={turn.failed ? 'true' : undefined}
      data-testid="site-question"
    >
      <p className={styles.bubble}>
        <span className="sr-only">You: </span>
        {turn.content}
      </p>
      {turn.failed ? <p className={styles.notSent}>Not sent</p> : null}
    </li>
  );
}

function Answer({
  turn,
  fresh,
  reduced,
  canRetry,
  onRetry,
  onSettle,
}: {
  turn: AssistantTurn;
  fresh: boolean;
  reduced: boolean;
  canRetry: boolean;
  onRetry: () => void;
  onSettle: () => void;
}) {
  const { shown, typing } = useTypeOut(turn.content, fresh, reduced, onSettle);
  const blocks = useMemo(() => replyBlocks(shown), [shown]);
  const sources = uniqueSources(turn.sources);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(turn.content);
      setCopied(true);
    } catch {
      // The clipboard can be blocked; the text can still be selected by hand.
    }
  };

  const plannerHref = turn.appLink
    ? (() => {
        const { place, timeMs } = plannerTarget(turn.appLink);
        return `/planner?${scenarioQuery(place, timeMs ?? turn.at)}`;
      })()
    : null;

  return (
    <li className={styles.answerRow} data-testid="site-answer">
      <span className={styles.answerMark} aria-hidden="true">
        <OrbitIcon />
      </span>
      <div className={styles.answerCol}>
        <span className="sr-only">Moon Maps: </span>
        <div className={styles.answer} aria-busy={typing || undefined}>
          <ReplyBody blocks={blocks} />
        </div>
        {!typing ? (
          <>
            {sources.length > 0 ? (
              <div className={styles.sources}>
                <span>Sources</span>
                <ol aria-label="Sources">
                  {sources.map((s, i) => (
                    <li
                      key={`${s.kind}:${s.id}`}
                      className={styles.source}
                      title={s.title}
                    >
                      <span className={styles.sourceNo}>{i + 1}</span>
                      <span className={styles.sourceTitle}>{s.title}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
            <div className={styles.actions}>
              <button type="button" className={styles.action} onClick={copy}>
                {copied ? 'Copied' : 'Copy'}
              </button>
              {canRetry ? (
                <button
                  type="button"
                  className={styles.action}
                  onClick={onRetry}
                >
                  Retry
                </button>
              ) : null}
              {plannerHref ? (
                <Link href={plannerHref} className={styles.action}>
                  Show in the planner
                </Link>
              ) : null}
            </div>
            <span className="sr-only" aria-live="polite">
              {copied ? 'Answer copied' : ''}
            </span>
          </>
        ) : null}
      </div>
    </li>
  );
}
