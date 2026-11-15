'use client';

import { fmtShort, plainDuration } from '@/lib/format/format';
import { EmptyState, LoadingState } from '@/components/ui/states';
import { windowJumpTime, type Interval } from '../lib/calendar';

/** "Best times to land here": the longest good windows ahead, in time order. Click to jump. */
export function BestWindows({
  best,
  failed,
  onPick,
}: {
  best: Interval[] | null;
  /** The request failed and there is nothing to show; the answer card offers the retry. */
  failed: boolean;
  onPick: (t: number) => void;
}) {
  return (
    <div
      className="min-w-0 rounded-3xl border border-line-2 bg-bg-2 p-7"
      data-reveal
    >
      <h3 className="font-display text-[26px] font-normal">
        Best times to land here
      </h3>
      {best === null ? (
        <div className="mt-5">
          {failed ? (
            <EmptyState>The best times could not be loaded.</EmptyState>
          ) : (
            <LoadingState label="Finding the best times…" />
          )}
        </div>
      ) : best.length === 0 ? (
        <div className="mt-5">
          <EmptyState>
            No good landing times here in the next 30 days. Try another place.
          </EmptyState>
        </div>
      ) : (
        <ol className="mt-5 grid list-none gap-2.5">
          {best.map((w, i) => (
            <li
              key={w.start}
              data-testid="best-window"
              data-start={w.start}
              data-end={w.end}
            >
              <button
                type="button"
                onClick={() => onPick(windowJumpTime(w))}
                className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border border-line bg-ok/5 px-[18px] py-4 text-left transition-[border-color,transform,background-color] duration-300 ease-(--ease) hover:translate-x-1 hover:border-ok hover:bg-ok/10"
              >
                <span className="grid size-8 place-items-center rounded-full bg-ok text-sm font-bold text-[#06140f]">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <b className="block text-[15px] font-semibold">
                    {fmtShort(w.start)}
                  </b>
                  <span className="text-[13px] text-faint">
                    until {fmtShort(w.end)}
                  </span>
                </span>
                <span className="text-[13px] whitespace-nowrap text-ok">
                  {plainDuration(w.end - w.start)}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
