'use client';

import { useScenarioStore } from '@/lib/state/scenario-store';
import { useHydrated } from '../hooks/use-hydrated';
import { useSite } from '../hooks/use-site';
import { fmtLatLon, fmtUtcDateTime } from '../lib/conversation';
import styles from './assistant.module.css';

/**
 * What the assistant is told about the screen with each question: the place and the planner
 * time, read live from the scenario store. A curated site shows its name once GET /sites has
 * answered (its id until then).
 */
export function ContextStrip() {
  const place = useScenarioStore((s) => s.place);
  const timeMs = useScenarioStore((s) => s.timeMs);
  const site = useSite(place.kind === 'site' ? place.id : null);
  // The time is the visitor's own clock, so it is only shown once the page runs in the browser.
  const hydrated = useHydrated();

  const name = place.kind === 'site' ? (site?.name ?? place.id) : 'Custom spot';
  const coords =
    place.kind === 'point'
      ? fmtLatLon(place.lat, place.lon)
      : site
        ? fmtLatLon(site.lat, site.lon)
        : null;
  const value = [name, coords, hydrated ? fmtUtcDateTime(timeMs) : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <p className={styles.context} data-testid="assistant-context">
      <span className={styles.contextLabel}>ON SCREEN</span>
      <span className={styles.contextValue} title={value}>
        {value}
      </span>
    </p>
  );
}
