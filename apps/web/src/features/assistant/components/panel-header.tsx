'use client';

import { CloseIcon, NewChatIcon, OrbitIcon } from '@/components/ui/icons';
import { useChatStore } from '../hooks/use-chat-store';
import { useUtcMinute } from '../hooks/use-utc-minute';
import { fmtUtcClock } from '../lib/conversation';
import styles from './assistant.module.css';

/** The header: avatar, name, AI tag, a UTC clock, the link status, New chat and Close. */
export function PanelHeader({
  className,
  canReset,
  onNewChat,
  onClose,
}: {
  className?: string;
  canReset: boolean;
  onNewChat: () => void;
  onClose: () => void;
}) {
  const minute = useUtcMinute();
  const link = useChatStore((s) => s.link);
  return (
    <header className={`${styles.header} ${className ?? ''}`}>
      <span className={styles.handle} aria-hidden="true" />
      <div className={styles.headRow}>
        <span className={styles.avatar} aria-hidden="true">
          <OrbitIcon />
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h2 className={styles.title}>Moon Maps assistant</h2>
          <span className={styles.tag}>AI</span>
        </div>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="New chat"
          data-tip="New chat"
          onClick={onNewChat}
          disabled={!canReset}
        >
          <NewChatIcon />
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Close the assistant"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      </div>
      <p className={styles.telemetry}>
        <span className="mono" aria-label="Time now in UTC">
          {minute ? fmtUtcClock(minute) : '--:-- UTC'}
        </span>
        <span
          className={styles.link}
          data-status={link}
          data-testid="assistant-link"
        >
          {link === 'ok' ? 'LINK OK' : 'NO LINK'}
        </span>
      </p>
    </header>
  );
}
