'use client';

import { useScenarioStore } from '@/lib/state/scenario-store';
import { usePlanner } from '../hooks/use-planner';
import { BestWindows } from './best-windows';
import { MonthCalendar } from './month-calendar';
import { SiteDiorama } from './site-diorama';
import { SitePicker } from './site-picker';
import { VerdictCard } from './verdict-card';
import { WhenPicker } from './when-picker';

/** The planner (#navigator): pick a place and a time, get a plain answer from the API. */
export function PlannerSection() {
  const setTime = useScenarioStore((s) => s.setTime);
  const planner = usePlanner();
  const failed = planner.error !== null && planner.days === null;

  return (
    <section
      className="section border-y border-line bg-bg-2"
      id="navigator"
      aria-labelledby="nv-h"
    >
      <div className="wrap">
        <div className="mb-12">
          <p className="eyebrow" data-reveal>
            The planner
          </p>
          <h2 className="h2" id="nv-h" data-lines>
            <span className="line">
              <span className="li">Is it a good time</span>
            </span>
            <span className="line">
              <span className="li">
                <em>to land there?</em>
              </span>
            </span>
          </h2>
          <p className="lead" data-reveal>
            Pick a place and a date. We tell you in plain words whether a lander
            would have sunlight for its solar panels and could talk to Earth.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 min-[1000px]:grid-cols-2 min-[1000px]:items-stretch [&>*]:min-w-0">
          <div className="grid gap-4">
            <SitePicker />
            <WhenPicker />
          </div>
          <VerdictCard
            verdict={planner.verdict}
            isPending={planner.isPending}
            isUpdating={planner.isUpdating}
            error={planner.error}
            onRetry={planner.refetch}
          />
        </div>

        <MonthCalendar
          days={planner.days}
          timeMs={planner.timeMs}
          failed={failed}
          onPick={setTime}
        />

        <div className="mt-6 grid grid-cols-1 gap-6 min-[1000px]:grid-cols-[1fr_1.25fr] [&>*]:min-w-0">
          <BestWindows best={planner.best} failed={failed} onPick={setTime} />
          <SiteDiorama />
        </div>
      </div>
    </section>
  );
}
