'use client';

import { useChatStore } from '../hooks/use-chat-store';
import styles from './assistant.module.css';

/**
 * The red strip at the top of the log: "Signal lost, retrying in 4 s" while waiting to retry,
 * "Signal lost" with Retry once the automatic retries are used up, or the API's own sentence.
 */
export function LogNotice({ onRetry }: { onRetry: () => void }) {
  const status = useChatStore((s) => s.status);
  const retryIn = useChatStore((s) => s.retryIn);
  const notice = useChatStore((s) => s.notice);

  if (status === 'retrying' && retryIn !== null)
    return (
      <p role="status" className={styles.notice}>
        <span>
          Signal lost, retrying in <span className="mono">{retryIn} s</span>
        </span>
      </p>
    );
  if (!notice) return null;
  if (notice.kind === 'signal')
    return (
      <p role="alert" className={styles.notice}>
        <span>Signal lost</span>
        {status === 'idle' ? (
          <button type="button" className={styles.textBtn} onClick={onRetry}>
            Retry
          </button>
        ) : null}
      </p>
    );
  return (
    <p role="alert" className={styles.notice}>
      <span>{notice.text}</span>
    </p>
  );
}
