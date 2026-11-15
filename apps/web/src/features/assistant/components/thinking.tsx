'use client';

import { useEffect, useState } from 'react';
import styles from './assistant.module.css';

/** Free models can take 10 to 40 seconds; after this long the wait is explained. */
const SLOW_AFTER_MS = 15_000;

/** An orbit spinner while an answer is on its way, with Stop. Still with reduced motion. */
export function Thinking({ onStop }: { onStop: () => void }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <div className={styles.thinking}>
      <span className={styles.orbit} aria-hidden="true" />
      <p role="status" aria-live="polite" className="flex-1">
        {slow ? 'Still working. Free AI models can be slow.' : 'Working on it'}
      </p>
      <button type="button" className={styles.textBtn} onClick={onStop}>
        Stop
      </button>
    </div>
  );
}
