'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useReducedMotion } from '@/lib/motion/reduced-motion';
import { useSmoothScroll } from '@/lib/motion/smooth-scroll';
import { useIntroStore } from '@/lib/state/intro-store';
import { useChatStore } from '../hooks/use-chat-store';
import { useConversation } from '../hooks/use-conversation';
import { isPhoneWidth } from '../hooks/use-is-phone';
import { useReveal } from '../hooks/use-reveal';
import styles from './assistant.module.css';
import { ChatPanel } from './chat-panel';
import { FloatingPills } from './floating-pills';
import { Launcher } from './launcher';

const PANEL_ID = 'moon-maps-assistant';
/** On a phone the panel closes first; the page scrolls once its scroll lock is released. */
const CLOSE_THEN_SCROLL_MS = 60;

/**
 * The Moon Maps assistant: a launcher tile in the bottom-right corner, up to two suggested
 * questions beside it before the first use, and the panel above it. Answers come from
 * POST /assistant/chat.
 */
export function Assistant() {
  const introDone = useIntroStore((s) => s.done);
  const reduced = useReducedMotion();
  const open = useChatStore((s) => s.open);
  const setOpen = useChatStore((s) => s.setOpen);
  const conversation = useConversation();
  const { scrollTo } = useSmoothScroll();
  const shellRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);

  useReveal(open, reduced, shellRef, launcherRef);

  const close = useCallback(() => {
    setOpen(false);
    launcherRef.current?.focus();
  }, [setOpen]);

  // Escape closes the panel from anywhere, unless something else already used the key.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  /** Jumps to a section of the page. The panel stays open on a large screen. */
  const goToSection = useCallback(
    (id: string) => {
      const target = document.getElementById(id);
      if (!target) return;
      if (isPhoneWidth()) {
        setOpen(false);
        window.setTimeout(() => scrollTo(target), CLOSE_THEN_SCROLL_MS);
      } else scrollTo(target);
    },
    [scrollTo, setOpen],
  );

  const askFromPill = useCallback(
    (text: string) => {
      setOpen(true);
      conversation.send(text);
    },
    [conversation, setOpen],
  );

  return (
    <div className={styles.root}>
      <FloatingPills ready={introDone || reduced} onAsk={askFromPill} />
      <ChatPanel
        id={PANEL_ID}
        shellRef={shellRef}
        open={open}
        conversation={conversation}
        onClose={close}
        onGoTo={goToSection}
      />
      <Launcher
        ref={launcherRef}
        ready={introDone || reduced}
        open={open}
        controls={PANEL_ID}
        onToggle={() => setOpen(!open)}
      />
    </div>
  );
}
