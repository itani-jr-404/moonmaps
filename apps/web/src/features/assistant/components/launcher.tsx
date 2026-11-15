'use client';

import type { Ref } from 'react';
import { CloseIcon, OrbitIcon } from '@/components/ui/icons';
import { useChatStore } from '../hooks/use-chat-store';
import { badgeText } from '../lib/conversation';
import styles from './assistant.module.css';

const LABEL = 'Ask the Moon Maps assistant';

/**
 * The corner tile that opens and closes the panel. Its status light, top right, is a steady earth
 * colour; with answers that arrived while the panel was closed it turns amber, blinks slowly
 * (steady with reduced motion) and shows how many.
 */
export function Launcher({
  ref,
  ready,
  open,
  controls,
  onToggle,
}: {
  ref: Ref<HTMLButtonElement>;
  ready: boolean;
  open: boolean;
  controls: string;
  onToggle: () => void;
}) {
  const unread = useChatStore((s) => s.unread);
  const hasUnread = unread > 0 && !open;
  const name = hasUnread
    ? `${LABEL}, ${unread} new ${unread === 1 ? 'answer' : 'answers'}`
    : LABEL;
  return (
    <button
      ref={ref}
      type="button"
      className={styles.launcher}
      data-ready={ready}
      data-open={open}
      aria-label={name}
      aria-expanded={open}
      aria-controls={controls}
      onClick={onToggle}
    >
      <span className={`${styles.icon} ${styles.iconOrbit}`}>
        <OrbitIcon />
      </span>
      <span className={`${styles.icon} ${styles.iconClose}`}>
        <CloseIcon />
      </span>
      <span
        className={styles.light}
        data-unread={hasUnread}
        data-testid="assistant-light"
        aria-hidden="true"
      >
        {hasUnread ? badgeText(unread) : null}
      </span>
    </button>
  );
}
