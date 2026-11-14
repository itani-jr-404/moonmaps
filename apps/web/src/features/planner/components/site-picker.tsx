'use client';

import { useSites } from '@/lib/api/hooks';
import { errorMessage } from '@/lib/api/client';
import { useScenarioStore } from '@/lib/state/scenario-store';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { chosenSpotLabel, PLANNER_SITES, siteLabel } from '../lib/site-labels';
import { PlannerStep } from './planner-step';

const siteBtn =
  'h-11 rounded-full border border-line-2 px-4 text-sm text-muted transition-[background-color,color,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-accent-2 hover:text-ink aria-pressed:border-transparent aria-pressed:bg-(image:--accent-grad) aria-pressed:font-semibold aria-pressed:text-on-accent';

/** Step 1: the curated places, plus the spot chosen on the globe when there is one. */
export function SitePicker() {
  const place = useScenarioStore((s) => s.place);
  const setPlace = useScenarioStore((s) => s.setPlace);
  const sites = useSites();

  const available = sites.data
    ? PLANNER_SITES.flatMap(({ id }) => {
        const site = sites.data.find((s) => s.id === id);
        return site ? [{ id, label: siteLabel(id, site.name) }] : [];
      })
    : [];

  return (
    <PlannerStep n={1} title="Where do you want to land?">
      {sites.isPending ? (
        <LoadingState label="Loading places…" />
      ) : sites.error ? (
        <ErrorState
          message={errorMessage(sites.error)}
          onRetry={() => void sites.refetch()}
        />
      ) : (
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Landing place"
        >
          {available.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={siteBtn}
              aria-pressed={place.kind === 'site' && place.id === id}
              onClick={() => setPlace({ kind: 'site', id })}
            >
              {label}
            </button>
          ))}
          {place.kind === 'point' ? (
            <button type="button" className={siteBtn} aria-pressed="true">
              {chosenSpotLabel(place.lat, place.lon)}
            </button>
          ) : null}
        </div>
      )}
      <p className="mt-3 text-[13px] text-faint">
        Or click any spot on the Moon in the{' '}
        <a
          href="#land"
          className="text-accent-2 underline underline-offset-[3px]"
        >
          landing section
        </a>
        .
      </p>
    </PlannerStep>
  );
}
