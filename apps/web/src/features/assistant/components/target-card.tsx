'use client';

import { CrosshairIcon } from '@/components/ui/icons';
import type { AppLink } from '@/lib/api/client';
import { useSite } from '../hooks/use-site';
import { fmtLatLon, fmtUtcDateTime } from '../lib/conversation';
import styles from './assistant.module.css';

/** The place and moment an answer computed, with a button that loads them into the planner. */
export function TargetCard({
  link,
  onLoad,
}: {
  link: AppLink;
  onLoad: (link: AppLink) => void;
}) {
  const site = useSite(link.site_id);
  const name = link.site_id ? (site?.name ?? link.site_id) : 'Custom spot';
  const t = Date.parse(link.t);
  return (
    <section
      className={styles.target}
      aria-label="Target"
      data-testid="assistant-target"
    >
      <CrosshairIcon />
      <span className={styles.targetName}>{name}</span>
      <span className={styles.targetMeta}>
        {fmtLatLon(link.lat, link.lon)}
        {Number.isFinite(t) ? ` · ${fmtUtcDateTime(t)}` : ''}
      </span>
      <button
        type="button"
        className={styles.loadBtn}
        onClick={() => onLoad(link)}
      >
        Load in planner
      </button>
    </section>
  );
}
