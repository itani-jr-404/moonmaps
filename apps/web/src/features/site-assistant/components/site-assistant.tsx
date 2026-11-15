'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { CloseIcon, OrbitIcon } from '@/components/ui/icons';
import { fmtLatLon } from '@/features/assistant/lib/conversation';
import {
  prefersReducedMotion,
  useReducedMotion,
} from '@/lib/motion/reduced-motion';
import {
  EMPTY_THREAD,
  siteKey,
  useSiteChatStore,
} from '../hooks/use-site-chat-store';
import {
  siteContext,
  useSiteConversation,
} from '../hooks/use-site-conversation';
import { siteSuggestions } from '../lib/suggestions';
import { SiteComposer } from './site-composer';
import { SiteMessages } from './site-messages';
import styles from './site-assistant.module.css';

export type SiteAssistantProps = {
  siteId: string | null;
  lat: number;
  lon: number;
  name: string;
  timeIso: string;
};

/** The panel opens this long after the page loads (at once with reduced motion). The team's choice. */
const POP_AFTER_MS = 1000;
const PANEL_ID = 'site-assistant';

/**
 * The chat about one landing site: docked on the right of the site page on a large screen, a
 * bottom sheet on a phone. It opens by itself shortly after the page loads and folds into an
 * "Ask about <site>" pill. Each site keeps its own conversation (in memory only), separate from
 * the global assistant; each request sends the site and the page's time as `context`, so the
 * server adds the site brief to the prompt.
 */
export function SiteAssistant({
  siteId,
  lat,
  lon,
  name,
  timeIso,
}: SiteAssistantProps) {
  const reduced = useReducedMotion();
  const key = siteKey(siteId, lat, lon);
  const context = useMemo(
    () => siteContext(siteId, lat, lon, timeIso),
    [siteId, lat, lon, timeIso],
  );
  const conversation = useSiteConversation(key, context);
  const thread = useSiteChatStore((s) => s.threads[key] ?? EMPTY_THREAD);
  const setDraft = useSiteChatStore((s) => s.setDraft);
  const settle = useSiteChatStore((s) => s.settle);

  /** null until the first open, so the pill does not flash before the panel pops up. */
  const [open, setOpen] = useState<boolean | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const id = window.setTimeout(
      () => setOpen((o) => (o === null ? true : o)),
      prefersReducedMotion() ? 0 : POP_AFTER_MS,
    );
    return () => window.clearTimeout(id);
  }, []);

  // Lets the page keep its content clear of the docked panel (see the CSS module).
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.siteAssistant = open ? 'open' : 'closed';
    return () => {
      delete root.dataset.siteAssistant;
    };
  }, [open]);

  const focusInput = useCallback(() => {
    requestAnimationFrame(() =>
      inputRef.current?.focus({ preventScroll: true }),
    );
  }, []);

  const collapse = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => pillRef.current?.focus());
  }, []);

  const expand = () => {
    setOpen(true);
    focusInput();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape' && !e.defaultPrevented) {
      e.preventDefault();
      collapse();
    }
  };

  const ask = (text: string) => {
    if (conversation.send(text)) focusInput();
  };

  const sendDraft = () => {
    if (conversation.send(thread.draft)) {
      setDraft(key, '');
      focusInput();
    }
  };

  const newChat = () => {
    conversation.reset();
    focusInput();
  };

  const onSettle = useCallback(() => settle(key), [settle, key]);
  const busy = thread.status !== 'idle';
  const coords = fmtLatLon(lat, lon);
  const title = `Ask about ${name}`;

  return (
    <>
      <aside
        ref={panelRef}
        id={PANEL_ID}
        role="complementary"
        aria-label={title}
        className={styles.panel}
        data-open={open === true}
        data-reduced={reduced}
        inert={open !== true}
        onKeyDown={onKeyDown}
        data-lenis-prevent
        data-testid="site-assistant"
      >
        <header className={styles.header}>
          <span className={styles.mark} aria-hidden="true">
            <OrbitIcon />
          </span>
          <div className={styles.headText}>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.coords}>{coords}</p>
          </div>
          {thread.turns.length > 0 || busy ? (
            <button
              type="button"
              className={styles.headBtn}
              onClick={newChat}
              aria-label="New chat"
              title="New chat"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          ) : null}
          <button
            type="button"
            className={styles.headBtn}
            onClick={collapse}
            aria-label="Collapse the chat"
            title="Collapse"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 12h12" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.headBtn}
            onClick={collapse}
            aria-label="Close the chat"
            title="Close"
          >
            <CloseIcon width={18} height={18} />
          </button>
        </header>

        <SiteMessages
          name={name}
          thread={thread}
          reduced={reduced}
          suggestions={siteSuggestions(name)}
          onAsk={ask}
          onRetry={conversation.retry}
          onSettle={onSettle}
        />

        <SiteComposer
          inputRef={inputRef}
          name={name}
          value={thread.draft}
          busy={busy}
          onChange={(v) => setDraft(key, v)}
          onSend={sendDraft}
          onStop={() => {
            conversation.stop();
            focusInput();
          }}
        />
      </aside>

      <button
        ref={pillRef}
        type="button"
        className={styles.pill}
        data-visible={open === false}
        aria-controls={PANEL_ID}
        aria-expanded={open === true}
        tabIndex={open === false ? 0 : -1}
        onClick={expand}
      >
        <span className={styles.pillMark} aria-hidden="true">
          <OrbitIcon />
        </span>
        {title}
      </button>
    </>
  );
}
