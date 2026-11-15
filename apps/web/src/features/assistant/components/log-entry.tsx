'use client';

import { Fragment, useMemo } from 'react';
import type { AppLink } from '@/lib/api/client';
import {
  fmtUtcClock,
  uniqueSources,
  type AssistantTurn,
  type FollowUp,
  type UserTurn,
} from '../lib/conversation';
import { linkify } from '../lib/linkify';
import { replyBlocks, type ReplyBlock } from '../lib/reply-blocks';
import styles from './assistant.module.css';
import { TargetCard } from './target-card';

/** Plain text with safe links. Never HTML: every part is a React text node or an <a>. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {linkify(text).map((part, i) =>
        part.kind === 'link' ? (
          <a key={i} href={part.href} target="_blank" rel="noopener noreferrer">
            {part.text}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : (
          <Fragment key={i}>{part.text}</Fragment>
        ),
      )}
    </>
  );
}

/** A reply's paragraphs and lists, each line through the safe linkify. */
export function ReplyBody({ blocks }: { blocks: ReplyBlock[] }) {
  return (
    <>
      {blocks.map((b, i) =>
        b.kind === 'p' ? (
          <p key={i}>
            <RichText text={b.text} />
          </p>
        ) : b.kind === 'ul' ? (
          <ul key={i}>
            {b.items.map((item, j) => (
              <li key={j}>
                <RichText text={item} />
              </li>
            ))}
          </ul>
        ) : (
          <ol key={i} start={b.start}>
            {b.items.map((item, j) => (
              <li key={j}>
                <RichText text={item} />
              </li>
            ))}
          </ol>
        ),
      )}
    </>
  );
}

/** A question: a rounded bubble on the right, its time underneath, "NOT SENT" and Retry on failure. */
export function QuestionEntry({
  turn,
  canRetry,
  onRetry,
}: {
  turn: UserTurn;
  canRetry: boolean;
  onRetry: () => void;
}) {
  return (
    <article
      className={styles.question}
      data-failed={turn.failed ? 'true' : undefined}
      data-testid="assistant-question"
    >
      <p className={styles.bubble}>
        <span className="sr-only">You: </span>
        {turn.content}
      </p>
      <p className={styles.bubbleMeta}>
        {turn.failed ? <span className={styles.notSent}>NOT SENT</span> : null}
        {turn.failed && canRetry ? (
          <button type="button" className={styles.textBtn} onClick={onRetry}>
            Retry
          </button>
        ) : null}
        <span>{fmtUtcClock(turn.at)}</span>
      </p>
    </article>
  );
}

/** An answer: plain text on the left (no bubble) with a label row, lists, numbered sources, the target card and follow-ups. */
export function AnswerEntry({
  turn,
  followUps,
  onAsk,
  onLoadInPlanner,
}: {
  turn: AssistantTurn;
  followUps: readonly FollowUp[];
  onAsk: (text: string) => void;
  onLoadInPlanner: (link: AppLink) => void;
}) {
  const blocks = useMemo(() => replyBlocks(turn.content), [turn.content]);
  const sources = uniqueSources(turn.sources);
  return (
    <article className={styles.entry} data-testid="assistant-answer">
      <p className={styles.entryHead}>
        <span className={styles.entryWho}>MOON MAPS</span>
        <span aria-hidden="true">·</span>
        <span>{fmtUtcClock(turn.at)}</span>
      </p>
      <div className={styles.answer}>
        <ReplyBody blocks={blocks} />
      </div>

      {sources.length > 0 ? (
        <div className={styles.footnotes}>
          <span>Sources</span>
          <ol aria-label="Sources">
            {sources.map((s, i) => (
              <li
                key={`${s.kind}:${s.id}`}
                className={styles.footnote}
                title={s.title}
                aria-label={s.title}
              >
                [{i + 1}]
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {turn.appLink ? (
        <TargetCard link={turn.appLink} onLoad={onLoadInPlanner} />
      ) : null}

      {followUps.length > 0 ? (
        <div
          className={styles.followups}
          role="group"
          aria-label="Quick replies"
        >
          {followUps.map((f) => (
            <button
              key={f.label}
              type="button"
              className={styles.quick}
              onClick={() => onAsk(f.text)}
            >
              {f.label}
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}
