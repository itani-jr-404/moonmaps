import type { ReactNode } from 'react';

/** A numbered step card (Step 1 "where", Step 2 "when"). */
export function PlannerStep({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className="grid grid-cols-[48px_minmax(0,1fr)] gap-4 rounded-3xl border border-line bg-[linear-gradient(180deg,#0f182b,#0a1120)] p-5 sm:gap-5 sm:p-7"
      data-reveal
    >
      <span
        className="grid size-12 place-items-center rounded-full bg-(image:--accent-grad) font-display text-[22px] font-semibold text-on-accent"
        aria-hidden="true"
      >
        {n}
      </span>
      <div className="min-w-0">
        <h3 className="mb-4 font-display text-[26px] font-normal">
          <span className="sr-only">Step {n}: </span>
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}
