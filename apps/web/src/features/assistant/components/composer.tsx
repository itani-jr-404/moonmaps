'use client';

import {
  useLayoutEffect,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { SendIcon } from '@/components/ui/icons';
import {
  matchCommands,
  type CommandAction,
  type SlashCommand,
} from '../lib/commands';
import { COUNTER_FROM, MAX_MESSAGE_CHARS } from '../lib/conversation';
import styles from './assistant.module.css';

/** The input grows with its text up to this height, then scrolls. Matches the CSS module. */
const MAX_INPUT_PX = 128;
/** The limit bar shows past this many characters. */
const BAR_FROM = 1500;
const INPUT_ID = 'assistant-input';
const COUNT_ID = 'assistant-count';
const HINT_ID = 'assistant-hint';
const MENU_ID = 'assistant-commands';
const optionId = (name: string) => `assistant-cmd-${name.slice(1)}`;

/**
 * The input: a "›" prompt, Enter sends, Shift+Enter starts a new line, 2,000 characters at most.
 * Typing "/" at the start opens the shortcut menu (a listbox the input controls, moved through
 * with the arrow keys; Enter runs the highlighted command, Escape closes the menu).
 */
export function Composer({
  inputRef,
  value,
  busy,
  onChange,
  onSend,
  onCommand,
}: {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  busy: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onCommand: (action: CommandAction) => void;
}) {
  const [highlight, setHighlight] = useState(0);
  /** The input text for which Escape closed the menu; typing anything else reopens it. */
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_PX)}px`;
    el.style.overflowY = el.scrollHeight > MAX_INPUT_PX ? 'auto' : 'hidden';
  }, [value, inputRef]);

  const matches = matchCommands(value);
  const menu =
    matches && matches.length > 0 && dismissedFor !== value ? matches : null;
  const active = menu ? Math.min(highlight, menu.length - 1) : -1;

  const change = (next: string) => {
    setHighlight(0);
    setDismissedFor(null);
    onChange(next);
  };

  const run = (cmd: SlashCommand) => {
    setHighlight(0);
    onCommand(cmd.action);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (menu) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const step = e.key === 'ArrowDown' ? 1 : -1;
        setHighlight((active + step + menu.length) % menu.length);
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        run(menu[active]!);
        return;
      }
      if (e.key === 'Escape') {
        // Closes the menu only; the panel stays open.
        e.preventDefault();
        setDismissedFor(value);
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSend();
    }
  };

  const fill = value.length > BAR_FROM ? value.length / MAX_MESSAGE_CHARS : 0;
  const showCount = value.length > COUNTER_FROM;

  return (
    <form
      className={styles.composer}
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
    >
      {menu ? (
        <ul
          id={MENU_ID}
          role="listbox"
          aria-label="Shortcuts"
          className={styles.menu}
        >
          {menu.map((cmd, i) => (
            <li
              key={cmd.name}
              id={optionId(cmd.name)}
              role="option"
              aria-selected={i === active}
              className={styles.option}
              // Keeps the focus in the input while choosing with the mouse.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => run(cmd)}
            >
              <span className={styles.optionName}>{cmd.name}</span>
              <span className={styles.optionText}>{cmd.description}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className={styles.field}>
        <span className={styles.prompt} aria-hidden="true">
          ›
        </span>
        <label htmlFor={INPUT_ID} className="sr-only">
          Your question
        </label>
        <textarea
          ref={inputRef}
          id={INPUT_ID}
          rows={1}
          maxLength={MAX_MESSAGE_CHARS}
          value={value}
          enterKeyHint="send"
          placeholder="Ask about the Moon or this spot"
          className={styles.textarea}
          aria-autocomplete="list"
          aria-controls={menu ? MENU_ID : undefined}
          aria-activedescendant={
            menu && active >= 0 ? optionId(menu[active]!.name) : undefined
          }
          aria-describedby={showCount ? `${HINT_ID} ${COUNT_ID}` : HINT_ID}
          onChange={(e) => change(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button
          type="submit"
          className={styles.send}
          disabled={!value.trim() || busy || !!menu}
          aria-label="Send"
        >
          <SendIcon />
        </button>
        {fill > 0 ? (
          <span
            className={styles.limit}
            style={{ width: `${fill * 100}%` }}
            aria-hidden="true"
          />
        ) : null}
      </div>
      <p className={styles.under}>
        <span id={HINT_ID}>Type / for shortcuts</span>
        {showCount ? (
          <span id={COUNT_ID} className="mono">
            {value.length.toLocaleString('en-GB')} /{' '}
            {MAX_MESSAGE_CHARS.toLocaleString('en-GB')}
          </span>
        ) : null}
      </p>
      <p className={styles.disclaimer}>
        AI assistant. Answers can be wrong; numbers come from the Moon Maps API.
      </p>
    </form>
  );
}
