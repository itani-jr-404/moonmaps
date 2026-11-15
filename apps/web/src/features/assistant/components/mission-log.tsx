'use client';

import { useLayoutEffect, useRef } from 'react';
import type { AppLink } from '@/lib/api/client';
import { useReducedMotion } from '@/lib/motion/reduced-motion';
import type { ChatStatus } from '../hooks/use-chat-store';
import {
  BEST_DATES_QUESTION,
  FOLLOW_UPS,
  SUGGESTED_QUESTIONS,
  type Turn,
} from '../lib/conversation';
import styles from './assistant.module.css';
import { AnswerEntry, QuestionEntry } from './log-entry';
import { Thinking } from './thinking';

/** Follow new messages only while the reader is this close to the bottom. */
const NEAR_BOTTOM_PX = 80;

/**
 * The conversation (role="log"), with the welcome block at its top: a headline, two action cards
 * and three suggested questions. The block is part of the log, so it scrolls away as the chat
 * grows and the first message causes no layout jump.
 */
export function MissionLog({
  turns,
  status,
  onAsk,
  onRetry,
  onStop,
  onLoadInPlanner,
  onGoTo,
}: {
  turns: Turn[];
  status: ChatStatus;
  onAsk: (text: string) => void;
  onRetry: () => void;
  onStop: () => void;
  onLoadInPlanner: (link: AppLink) => void;
  /** Opens a page of the app, or a section of one ("/#why"). */
  onGoTo: (href: string) => void;
}) {
  const reduced = useReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const seen = useRef(turns.length);

  // Scrolls the log itself (not scrollIntoView), so the input keeps the focus.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    // With no messages the welcome block shows from its top (also after New chat).
    if (turns.length === 0) {
      el.scrollTop = 0;
      nearBottom.current = true;
      seen.current = 0;
      return;
    }
    const added = turns.length > seen.current;
    seen.current = turns.length;
    const askedNow = added && turns.at(-1)?.role === 'user';
    if (nearBottom.current || askedNow)
      el.scrollTo({
        top: el.scrollHeight,
        behavior: reduced ? 'auto' : 'smooth',
      });
  }, [turns, status, reduced]);

  const onScroll = () => {
    const el = listRef.current;
    if (el)
      nearBottom.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  };

  const lastIndex = turns.length - 1;
  const idle = status === 'idle';

  return (
    <div
      ref={listRef}
      role="log"
      aria-live="polite"
      aria-label="Conversation"
      className={styles.log}
      onScroll={onScroll}
    >
      <section className={styles.welcome} aria-label="Welcome">
        <p className={styles.kicker}>Ask Moon Maps</p>
        <h3 className={styles.headline}>
          Questions about the Moon and{' '}
          <span className="accent-text">where to land</span>
        </h3>
        <p className={styles.subtitle}>
          Ask what the app shows, whether a spot has sunlight and a view of
          Earth, or when it is next good for landing.
        </p>
        <div className={styles.cards}>
          <button
            type="button"
            className={styles.card}
            onClick={() => onGoTo('/planner')}
          >
            <span className="text-sm font-semibold">Plan a landing</span>
            <span className="text-xs text-faint">Open the planner</span>
          </button>
          <button
            type="button"
            className={styles.card}
            onClick={() => onAsk(BEST_DATES_QUESTION)}
            disabled={!idle}
          >
            <span className="text-sm font-semibold">Best dates this month</span>
            <span className="text-xs text-faint">For the spot on screen</span>
          </button>
        </div>
        <ul className={styles.commands} aria-label="Suggested questions">
          {SUGGESTED_QUESTIONS.map((q) => (
            <li key={q}>
              <button
                type="button"
                className={styles.command}
                onClick={() => onAsk(q)}
                disabled={!idle}
              >
                <span className={styles.prompt} aria-hidden="true">
                  ›
                </span>
                {q}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {turns.map((turn, i) =>
        turn.role === 'user' ? (
          <QuestionEntry
            key={turn.id}
            turn={turn}
            canRetry={i === lastIndex && idle}
            onRetry={onRetry}
          />
        ) : (
          <AnswerEntry
            key={turn.id}
            turn={turn}
            followUps={i === lastIndex && idle ? FOLLOW_UPS : []}
            onAsk={onAsk}
            onLoadInPlanner={onLoadInPlanner}
          />
        ),
      )}

      {!idle ? <Thinking onStop={onStop} /> : null}
    </div>
  );
}
