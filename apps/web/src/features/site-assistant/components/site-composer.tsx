'use client';

import { useLayoutEffect, type KeyboardEvent, type RefObject } from 'react';
import { SendIcon } from '@/components/ui/icons';
import {
  COUNTER_FROM,
  MAX_MESSAGE_CHARS,
} from '@/features/assistant/lib/conversation';
import styles from './site-assistant.module.css';

/** The input grows with its text up to this height, then scrolls. Matches the CSS module. */
const MAX_INPUT_PX = 180;

/**
 * The input: a large rounded box, Enter sends, Shift+Enter starts a new line, 2,000 characters at
 * most. The round Send button turns into Stop while an answer is on its way.
 */
export function SiteComposer({
  inputRef,
  name,
  value,
  busy,
  onChange,
  onSend,
  onStop,
}: {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  name: string;
  value: string;
  busy: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
}) {
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_PX)}px`;
  }, [value, inputRef]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    if (!busy) onSend();
  };

  const empty = value.trim().length === 0;

  return (
    <div className={styles.composerWrap}>
      <form
        className={styles.composer}
        onSubmit={(e) => {
          e.preventDefault();
          if (!busy) onSend();
        }}
      >
        <label htmlFor="site-assistant-input" className="sr-only">
          Your question about {name}
        </label>
        <textarea
          ref={inputRef}
          id="site-assistant-input"
          className={styles.input}
          rows={1}
          value={value}
          maxLength={MAX_MESSAGE_CHARS}
          placeholder={`Ask anything about ${name}`}
          aria-describedby="site-assistant-hint"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className={styles.composerRow}>
          {value.length >= COUNTER_FROM ? (
            <span className={styles.counter} aria-live="polite">
              {value.length.toLocaleString('en-US')} /{' '}
              {MAX_MESSAGE_CHARS.toLocaleString('en-US')}
            </span>
          ) : (
            <span />
          )}
          {busy ? (
            <button
              type="button"
              className={styles.send}
              data-stop="true"
              onClick={onStop}
              aria-label="Stop"
            >
              <span className={styles.stopSquare} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="submit"
              className={styles.send}
              disabled={empty}
              aria-label="Send"
            >
              <SendIcon width={18} height={18} />
            </button>
          )}
        </div>
      </form>
      <p id="site-assistant-hint" className={styles.hint}>
        AI can make mistakes. Numbers come from the Moon Maps API.
      </p>
    </div>
  );
}
