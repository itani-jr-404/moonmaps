import type { ReactNode } from 'react';

/** Shared loading, empty and error states, so every view handles all three the same way. */
export function LoadingState({
  label = 'Working it out…',
}: {
  label?: string;
}) {
  return (
    <p role="status" className="flex items-center gap-3 text-sm text-faint">
      <span
        className="size-3 animate-pulse rounded-full bg-accent-2"
        aria-hidden="true"
      />
      {label}
    </p>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-[15px] text-faint">{children}</p>;
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 text-sm text-warn"
    >
      <span>{message}</span>
      {onRetry ? (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onRetry}
        >
          <span className="btn-label">Try again</span>
        </button>
      ) : null}
    </div>
  );
}
