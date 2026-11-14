'use client';

import { EmptyState, LoadingState } from '@/components/ui/states';
import { dayJumpTime, type CalendarDay, type DayKind } from '../lib/calendar';

/** Colour of each kind of day (prototype values: ok green, sun amber, dark blue-grey). */
const KIND: Record<
  DayKind,
  { color: string; text: (d: CalendarDay) => string }
> = {
  good: { color: '[--c:#62D6A0]', text: () => 'Good day' },
  some: {
    color: '[--c:#FFC36B]',
    text: (d) => `Good for some hours (${Math.max(1, Math.round(d.hours))})`,
  },
  bad: { color: '[--c:#2a3550]', text: () => 'Not good' },
};

function Legend() {
  return (
    <div className="flex flex-wrap gap-4 text-[13px] text-faint">
      {(['good', 'some', 'bad'] as const).map((k) => (
        <span key={k} className="inline-flex items-center gap-2">
          <i
            className={`block size-3.5 rounded-[4px] bg-(--c) ${KIND[k].color}`}
          />
          {k === 'good'
            ? 'Good day'
            : k === 'some'
              ? 'Good for some hours'
              : 'Not good'}
        </span>
      ))}
    </div>
  );
}

/** The next 30 days at this place: each day graded from the API's good windows. Click a day to check it. */
export function MonthCalendar({
  days,
  timeMs,
  failed,
  onPick,
}: {
  days: CalendarDay[] | null;
  timeMs: number;
  /** The request failed and there is nothing to show; the card above offers the retry. */
  failed: boolean;
  onPick: (t: number) => void;
}) {
  return (
    <div
      className="mt-6 rounded-3xl border border-line bg-bg-2 p-7"
      data-reveal
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-[26px] font-normal">
          The next 30 days at this place
        </h3>
        <Legend />
      </div>
      {days === null && failed ? (
        <EmptyState>The calendar could not be loaded.</EmptyState>
      ) : days === null ? (
        <LoadingState label="Checking the next 30 days…" />
      ) : days.length === 0 ? (
        <EmptyState>No days to show.</EmptyState>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-2">
          {days.map((d) => {
            const k = KIND[d.kind];
            const dt = new Date(d.start);
            const label = `${dt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}: ${k.text(d)}`;
            const selected = timeMs >= d.start && timeMs < d.end;
            return (
              <button
                key={d.start}
                type="button"
                aria-pressed={selected}
                data-testid="calendar-day"
                data-kind={d.kind}
                data-start={d.start}
                aria-label={label}
                title={label}
                onClick={() => onPick(dayJumpTime(d))}
                className={`${k.color} relative grid justify-items-center gap-0.5 rounded-[14px] border border-line bg-white/[.02] px-1 pt-2.5 pb-3 transition-[transform,border-color,background-color] duration-300 ease-(--ease) hover:-translate-y-[3px] hover:border-accent-2 aria-pressed:border-accent-2 aria-pressed:bg-accent/[.18] aria-pressed:shadow-[0_0_0_1px_var(--color-accent-2)]`}
              >
                <span className="text-[11px] tracking-widest text-faint uppercase">
                  {dt.toLocaleDateString('en-GB', { weekday: 'short' })}
                </span>
                <span
                  className={`font-display text-[22px] leading-[1.1] ${d.kind === 'bad' ? 'text-faint' : ''}`}
                >
                  {dt.getDate()}
                </span>
                <span className="text-[11px] text-faint">
                  {dt.toLocaleDateString('en-GB', { month: 'short' })}
                </span>
                <span
                  className="mt-1.5 h-[5px] w-[70%] rounded-[3px] bg-(--c)"
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-[13px] text-faint">Click a day to check it.</p>
    </div>
  );
}
