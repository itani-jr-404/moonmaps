'use client';

import { useScenarioUrlSync } from '@/lib/state/url-sync';

/** Keeps the planner's place and time in the address while the planner page is open. */
export function PlannerUrlSync() {
  useScenarioUrlSync();
  return null;
}
