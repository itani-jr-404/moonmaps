/** Waits before each automatic retry: 1 s, 2 s, 4 s, then 8 s. After that the user retries by hand. */
export const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000] as const;

function abortError(): DOMException {
  return new DOMException('The request was stopped.', 'AbortError');
}

/** Waits `ms`, calling `tick` with the whole seconds left now and after each second. */
export function countdown(
  ms: number,
  signal: AbortSignal,
  tick: (secondsLeft: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(abortError());
    let left = ms;
    let timer: ReturnType<typeof setTimeout>;
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    const step = () => {
      if (left <= 0) {
        signal.removeEventListener('abort', onAbort);
        resolve();
        return;
      }
      tick(Math.ceil(left / 1000));
      const wait = Math.min(1000, left);
      left -= wait;
      timer = setTimeout(step, wait);
    };
    signal.addEventListener('abort', onAbort, { once: true });
    step();
  });
}

/**
 * Runs `attempt`, and when it fails with an error `shouldRetry` accepts, waits and tries again,
 * once per entry of `delays`. The last error is thrown when the retries run out. `onWait` reports
 * the countdown before each retry (retryNo starts at 1).
 */
export async function withBackoff<T>(
  attempt: () => Promise<T>,
  options: {
    signal: AbortSignal;
    shouldRetry: (error: unknown) => boolean;
    onWait?: (secondsLeft: number, retryNo: number) => void;
    delays?: readonly number[];
  },
): Promise<T> {
  const delays = options.delays ?? RETRY_DELAYS_MS;
  for (let i = 0; ; i++) {
    try {
      return await attempt();
    } catch (error) {
      const delay = delays[i];
      if (
        delay === undefined ||
        options.signal.aborted ||
        !options.shouldRetry(error)
      )
        throw error;
      await countdown(delay, options.signal, (s) => options.onWait?.(s, i + 1));
    }
  }
}
