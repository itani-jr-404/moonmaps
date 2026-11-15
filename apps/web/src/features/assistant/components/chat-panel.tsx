'use client';

import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import type { AppLink } from '@/lib/api/client';
import { useSmoothScroll } from '@/lib/motion/smooth-scroll';
import { useScenarioStore } from '@/lib/state/scenario-store';
import { useChatStore, type ChatTab } from '../hooks/use-chat-store';
import { useContainScroll } from '../hooks/use-contain-scroll';
import type { useConversation } from '../hooks/use-conversation';
import { isPhoneWidth, useIsPhone } from '../hooks/use-is-phone';
import type { CommandAction } from '../lib/commands';
import { plannerTarget } from '../lib/conversation';
import styles from './assistant.module.css';
import { Composer } from './composer';
import { ContextStrip } from './context-strip';
import { LogNotice } from './log-notice';
import { MissionLog } from './mission-log';
import { PanelHeader } from './panel-header';
import { ResourcesView } from './resources-view';

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])';

const TABS: { id: ChatTab; label: string }[] = [
  { id: 'chat', label: 'Chat' },
  { id: 'resources', label: 'Resources' },
];
const tabId = (t: ChatTab) => `assistant-tab-${t}`;
const tabPanelId = (t: ChatTab) => `assistant-tabpanel-${t}`;

/**
 * The panel: header, Chat and Resources tabs, the context readout, and the log with its
 * input. On a large screen it sits above the launcher and the page stays usable; below 480 px it
 * fills the screen, holds the focus and stops the page from scrolling behind it.
 */
export function ChatPanel({
  id,
  shellRef,
  open,
  conversation,
  onClose,
  onGoTo,
}: {
  id: string;
  shellRef: RefObject<HTMLDivElement | null>;
  open: boolean;
  conversation: ReturnType<typeof useConversation>;
  onClose: () => void;
  onGoTo: (sectionId: string) => void;
}) {
  const isPhone = useIsPhone();
  const tab = useChatStore((s) => s.tab);
  const setTab = useChatStore((s) => s.setTab);
  const turns = useChatStore((s) => s.turns);
  const status = useChatStore((s) => s.status);
  const draft = useChatStore((s) => s.draft);
  const setDraft = useChatStore((s) => s.setDraft);
  const setPlace = useScenarioStore((s) => s.setPlace);
  const setTime = useScenarioStore((s) => s.setTime);
  const { lock } = useSmoothScroll();
  const panelRef = useRef<HTMLDivElement>(null);
  useContainScroll(panelRef, open);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const tabRefs = useRef<Record<ChatTab, HTMLButtonElement | null>>({
    chat: null,
    resources: null,
  });

  // Focus moves into the panel when it opens: the input on a large screen, the panel itself on a
  // phone (so the on-screen keyboard does not jump up at once).
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      // The frame can come late on a busy page; never take the focus back from inside the panel.
      if (panelRef.current?.contains(document.activeElement)) return;
      if (isPhoneWidth() || useChatStore.getState().tab !== 'chat')
        panelRef.current?.focus();
      else inputRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!open || !isPhone) return;
    lock(true);
    return () => lock(false);
  }, [open, isPhone, lock]);

  const focusInput = useCallback(() => {
    requestAnimationFrame(() =>
      inputRef.current?.focus({ preventScroll: true }),
    );
  }, []);

  const ask = useCallback(
    (text: string) => {
      if (conversation.send(text)) focusInput();
    },
    [conversation, focusInput],
  );

  const sendDraft = () => {
    if (conversation.send(draft)) {
      setDraft('');
      focusInput();
    }
  };

  const loadInPlanner = (link: AppLink) => {
    const { place, timeMs } = plannerTarget(link);
    setPlace(place);
    if (timeMs !== null) setTime(timeMs);
    onGoTo('navigator');
  };

  const newChat = () => {
    conversation.reset();
    focusInput();
  };

  const runCommand = (action: CommandAction) => {
    setDraft('');
    if (action.kind === 'section') onGoTo(action.id);
    else if (action.kind === 'resources') {
      setTab('resources');
      requestAnimationFrame(() => tabRefs.current.resources?.focus());
    } else newChat();
  };

  // Arrow keys, Home and End move between the tabs (WAI-ARIA tabs pattern, automatic activation:
  // https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ , W3C, read 2026-11-15).
  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = TABS.findIndex((t) => t.id === tab);
    const next =
      e.key === 'ArrowRight'
        ? (i + 1) % TABS.length
        : e.key === 'ArrowLeft'
          ? (i - 1 + TABS.length) % TABS.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? TABS.length - 1
              : -1;
    if (next < 0) return;
    e.preventDefault();
    const t = TABS[next]!.id;
    setTab(t);
    tabRefs.current[t]?.focus();
  };

  // Tab stays inside the panel while it fills the screen.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !isPhone || !panelRef.current) return;
    const items = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
    ).filter((el) => el.offsetParent !== null);
    const first = items[0];
    const last = items.at(-1);
    if (!first || !last) return;
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const busy = status !== 'idle';

  return (
    <div ref={shellRef} className={styles.shell} data-open={open}>
      <div
        ref={panelRef}
        id={id}
        data-hud="panel"
        role="dialog"
        aria-modal={isPhone || undefined}
        aria-label="Moon Maps assistant"
        tabIndex={-1}
        inert={!open}
        data-lenis-prevent
        className={styles.panel}
        onKeyDown={onKeyDown}
      >
        <PanelHeader
          className={styles.stage1}
          canReset={turns.length > 0 || busy}
          onNewChat={newChat}
          onClose={onClose}
        />

        <div className={styles.stage2}>
          <div
            role="tablist"
            aria-label="Assistant views"
            className={styles.tabs}
            onKeyDown={onTabKey}
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[t.id] = el;
                }}
                type="button"
                role="tab"
                id={tabId(t.id)}
                aria-selected={tab === t.id}
                aria-controls={tabPanelId(t.id)}
                tabIndex={tab === t.id ? 0 : -1}
                className={styles.tab}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <ContextStrip />
        </div>

        <div
          role="tabpanel"
          id={tabPanelId('chat')}
          aria-labelledby={tabId('chat')}
          hidden={tab !== 'chat'}
          className={`${styles.tabPanel} ${styles.stage3}`}
        >
          <LogNotice onRetry={conversation.retry} />
          <MissionLog
            turns={turns}
            status={status}
            onAsk={ask}
            onRetry={conversation.retry}
            onStop={() => {
              conversation.stop();
              focusInput();
            }}
            onLoadInPlanner={loadInPlanner}
            onGoTo={onGoTo}
          />
          <Composer
            inputRef={inputRef}
            value={draft}
            busy={busy}
            onChange={setDraft}
            onSend={sendDraft}
            onCommand={runCommand}
          />
        </div>

        <div
          role="tabpanel"
          id={tabPanelId('resources')}
          aria-labelledby={tabId('resources')}
          hidden={tab !== 'resources'}
          className={`${styles.tabPanel} ${styles.stage3}`}
        >
          <ResourcesView />
        </div>
      </div>
      {[0, 1, 2, 3].map((corner) => (
        <span
          key={corner}
          data-hud="bracket"
          data-corner={corner}
          className={styles.bracket}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
