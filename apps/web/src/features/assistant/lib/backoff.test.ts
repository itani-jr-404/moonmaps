import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RETRY_DELAYS_MS, withBackoff } from './backoff';

describe('withBackoff', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('retries after 1, 2, 4 and 8 seconds, then gives up', async () => {
    const attempt = vi.fn().mockRejectedValue(new Error('down'));
    const waits: Array<[number, number]> = [];
    const run = withBackoff(attempt, {
      signal: new AbortController().signal,
      shouldRetry: () => true,
      onWait: (s, n) => waits.push([s, n]),
    });
    const settled = run.catch((e: Error) => e);

    await vi.advanceTimersByTimeAsync(0);
    expect(attempt).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(999);
    expect(attempt).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(attempt).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(2000);
    expect(attempt).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(4000);
    expect(attempt).toHaveBeenCalledTimes(4);
    await vi.advanceTimersByTimeAsync(8000);
    expect(attempt).toHaveBeenCalledTimes(5);

    expect(((await settled) as Error).message).toBe('down');
    expect(RETRY_DELAYS_MS).toEqual([1000, 2000, 4000, 8000]);
    // A countdown in whole seconds before each retry.
    expect(waits.filter(([, n]) => n === 3).map(([s]) => s)).toEqual([
      4, 3, 2, 1,
    ]);
  });

  it('returns as soon as an attempt works', async () => {
    const attempt = vi
      .fn()
      .mockRejectedValueOnce(new Error('down'))
      .mockResolvedValueOnce('answer');
    const run = withBackoff(attempt, {
      signal: new AbortController().signal,
      shouldRetry: () => true,
    });
    await vi.advanceTimersByTimeAsync(1000);
    await expect(run).resolves.toBe('answer');
    expect(attempt).toHaveBeenCalledTimes(2);
  });

  it('does not retry an error it should not', async () => {
    const attempt = vi.fn().mockRejectedValue(new Error('unavailable'));
    await expect(
      withBackoff(attempt, {
        signal: new AbortController().signal,
        shouldRetry: () => false,
      }),
    ).rejects.toThrow('unavailable');
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it('stops waiting when aborted', async () => {
    const ctl = new AbortController();
    const attempt = vi.fn().mockRejectedValue(new Error('down'));
    const run = withBackoff(attempt, {
      signal: ctl.signal,
      shouldRetry: () => true,
    });
    const settled = run.catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(500);
    ctl.abort();
    const error = (await settled) as DOMException;
    expect(error.name).toBe('AbortError');
    await vi.advanceTimersByTimeAsync(20_000);
    expect(attempt).toHaveBeenCalledTimes(1);
  });
});
