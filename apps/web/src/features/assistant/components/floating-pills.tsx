'use client';

import { CloseIcon } from '@/components/ui/icons';
import { useChatStore } from '../hooks/use-chat-store';
import { FLOATING_QUESTIONS } from '../lib/conversation';
import styles from './assistant.module.css';

/**
 * Up to two suggested questions next to the launcher, shown until the panel is first opened or
 * the visitor hides them. Tapping one opens the panel and asks it.
 */
export function FloatingPills({
  ready,
  onAsk,
}: {
  ready: boolean;
  onAsk: (text: string) => void;
}) {
  const opened = useChatStore((s) => s.opened);
  const dismissed = useChatStore((s) => s.pillsDismissed);
  const dismiss = useChatStore((s) => s.dismissPills);
  if (!ready || opened || dismissed) return null;
  return (
    <div className={styles.pills} role="group" aria-label="Suggested questions">
      <button
        type="button"
        className={styles.dismiss}
        aria-label="Hide suggested questions"
        onClick={dismiss}
      >
        <CloseIcon />
      </button>
      {FLOATING_QUESTIONS.map((q) => (
        <button
          key={q}
          type="button"
          className={styles.pill}
          onClick={() => onAsk(q)}
        >
          <span className={styles.prompt} aria-hidden="true">
            ›
          </span>
          {q}
        </button>
      ))}
    </div>
  );
}
