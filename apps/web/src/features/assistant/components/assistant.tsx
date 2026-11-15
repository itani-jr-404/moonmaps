'use client';

import { usePathname, useRouter } from 'next/navigation';
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

/** Site pages have their own assistant (features/site-assistant); the global one stays hidden there. */
export function isSitePage(pathname: string | null): boolean {
  return !!pathname && pathname.startsWith('/sites/');
}

/**
 * Hides the global assistant on a site page. A separate component, so the assistant's own hooks
 * are not called on a page where it is hidden.
 */
export function Assistant() {
  const pathname = usePathname();
  if (isSitePage(pathname)) return null;
  return <GlobalAssistant />;
}

/**
 * The Moon Maps assistant: a launcher tile in the bottom-right corner, up to two suggested
 * questions beside it before the first use, and the panel above it. Answers come from
 * POST /assistant/chat.
 */
function GlobalAssistant() {
  const introDone = useIntroStore((s) => s.done);
  const reduced = useReducedMotion();
  const open = useChatStore((s) => s.open);
  const setOpen = useChatStore((s) => s.setOpen);
  const conversation = useConversation();
  const { scrollTo } = useSmoothScroll();
  const router = useRouter();
  const pathname = usePathname();
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

  /**
   * Opens a page of the app with the router, or scrolls to a section when it is on this page
   * ("/#why" on the home page). The panel stays open on a large screen.
   */
  const goTo = useCallback(
    (href: string) => {
      const url = new URL(href, window.location.origin);
      const id = url.hash.slice(1);
      const target =
        url.pathname === pathname && id ? document.getElementById(id) : null;
      const go = () => (target ? scrollTo(target) : router.push(href));
      if (isPhoneWidth()) {
        setOpen(false);
        window.setTimeout(go, CLOSE_THEN_SCROLL_MS);
      } else go();
    },
    [pathname, router, scrollTo, setOpen],
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
        onGoTo={goTo}
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
