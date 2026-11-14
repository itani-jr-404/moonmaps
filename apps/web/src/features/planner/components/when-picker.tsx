'use client';

import { useSyncExternalStore } from 'react';

import { useScenarioStore } from '@/lib/state/scenario-store';
import { DAY, HOUR } from '../lib/calendar';
import { PlannerStep } from './planner-step';

const QUICK: ReadonlyArray<{ days: number; label: string }> = [
  { days: 0, label: 'Now' },
  { days: 1, label: 'Tomorrow' },
  { days: 7, label: 'In a week' },
  { days: 30, label: 'In a month' },
];

const pad2 = (n: number) => String(n).padStart(2, '0');
const dateValue = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const timeValue = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

const noop = () => () => {};
/** False during server rendering: the inputs show local time, which the server does not know. */
function useIsClient(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

const inputCls =
  'h-[52px] rounded-[14px] border border-line-2 bg-white/[.03] px-3.5 text-base text-ink [color-scheme:dark] focus:border-accent focus:outline-none';

/** Step 2: date and time in the visitor's own time zone, plus quick choices. */
export function WhenPicker() {
  const timeMs = useScenarioStore((s) => s.timeMs);
  const setTime = useScenarioStore((s) => s.setTime);
  const isClient = useIsClient();
  const d = new Date(timeMs);

  const apply = (date: string, time: string) => {
    if (!date) return;
    const t = new Date(`${date}T${time || '12:00'}`).getTime();
    if (!Number.isNaN(t)) setTime(t);
  };

  return (
    <PlannerStep n={2} title="When?">
      <div className="mb-3 grid grid-cols-[1.4fr_1fr] gap-3">
        <label className="grid gap-1.5 text-xs text-faint">
          <span>Date</span>
          <input
            type="date"
            className={inputCls}
            value={isClient ? dateValue(d) : ''}
            onChange={(e) => apply(e.target.value, timeValue(d))}
          />
        </label>
        <label className="grid gap-1.5 text-xs text-faint">
          <span>Time</span>
          <input
            type="time"
            step={3600}
            className={inputCls}
            value={isClient ? timeValue(d) : ''}
            onChange={(e) => apply(dateValue(d), e.target.value)}
          />
        </label>
      </div>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Quick dates"
      >
        {QUICK.map((q) => (
          <button
            key={q.days}
            type="button"
            className="chip"
            onClick={() =>
              setTime(Math.round((Date.now() + q.days * DAY) / HOUR) * HOUR)
            }
          >
            {q.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-[13px] text-faint">
        Times are shown in your own time zone.
      </p>
    </PlannerStep>
  );
}
