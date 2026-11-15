import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, type ChatResponse } from '@/lib/api/client';
import { UNAVAILABLE_MESSAGE } from '../lib/conversation';
import { useChatStore } from './use-chat-store';
import { useConversation } from './use-conversation';

const mutateAsync = vi.fn();
vi.mock('@/lib/api/hooks', () => ({
  useAssistantChat: () => ({ mutateAsync }),
}));
const playChime = vi.fn();
vi.mock('../lib/chime', () => ({ playChime: () => playChime() }));

const answer: ChatResponse = {
  reply: 'Haworth gets sunlight now.',
  sources: [{ kind: 'tool', id: 'analyze', title: 'Moon Maps analysis' }],
  tools_used: ['analyze'],
  app_link: null,
};

function setup(open = true) {
  useChatStore.setState(useChatStore.getInitialState(), true);
  useChatStore.setState({ open });
  return renderHook(() => useConversation()).result;
}

const state = () => useChatStore.getState();

beforeEach(() => {
  vi.useFakeTimers();
  mutateAsync.mockReset();
  playChime.mockReset();
});
afterEach(() => vi.useRealTimers());

describe('useConversation', () => {
  it('sends the question with the place on screen and shows the answer', async () => {
    mutateAsync.mockResolvedValue(answer);
    const chat = setup();
    await act(async () => {
      chat.current.send('Is this spot good right now?');
    });
    const body = mutateAsync.mock.calls[0]![0].body;
    expect(body.messages).toEqual([
      { role: 'user', content: 'Is this spot good right now?' },
    ]);
    expect(body.context.site_id).toBeTypeOf('string');
    expect(body.context.t).toMatch(/Z$/);
    expect(state().turns.at(-1)).toMatchObject({
      role: 'assistant',
      content: answer.reply,
    });
    expect(state().status).toBe('idle');
  });

  it('retries a network failure after 1, 2 and 4 seconds with a countdown', async () => {
    mutateAsync
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockRejectedValueOnce(new ApiError('internal', 'Oops', 500))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(answer);
    const chat = setup();
    await act(async () => {
      chat.current.send('Hello');
    });
    expect(state().status).toBe('retrying');
    expect(state().retryIn).toBe(1);
    expect(state().link).toBe('lost');
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(mutateAsync).toHaveBeenCalledTimes(2);
    expect(state().retryIn).toBe(2);
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(state().retryIn).toBe(1);
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(mutateAsync).toHaveBeenCalledTimes(3);
    expect(state().retryIn).toBe(4);
    await act(() => vi.advanceTimersByTimeAsync(4000));
    expect(mutateAsync).toHaveBeenCalledTimes(4);
    expect(state().turns.at(-1)?.role).toBe('assistant');
    expect(state().notice).toBeNull();
    expect(state().link).toBe('ok');
  });

  it('marks the question "not sent" after the last automatic retry', async () => {
    mutateAsync.mockRejectedValue(new TypeError('Failed to fetch'));
    const chat = setup();
    await act(async () => {
      chat.current.send('Hello');
    });
    await act(() => vi.advanceTimersByTimeAsync(15_000));
    expect(mutateAsync).toHaveBeenCalledTimes(5);
    expect(state().turns.at(-1)).toMatchObject({ role: 'user', failed: true });
    expect(state().status).toBe('idle');
    expect(state().notice).toEqual({ kind: 'signal' });
    expect(state().link).toBe('lost');

    mutateAsync.mockReset().mockResolvedValue(answer);
    await act(async () => {
      chat.current.retry();
    });
    expect(state().turns.map((t) => t.role)).toEqual(['user', 'assistant']);
    expect(state().turns[0]).toMatchObject({ failed: false });
  });

  it('puts the question back in the input on 429 and shows the wait', async () => {
    mutateAsync.mockRejectedValue(
      new ApiError(
        'rate_limited',
        'Too many questions in a short time. Please wait 12 seconds.',
        429,
      ),
    );
    const chat = setup();
    await act(async () => {
      chat.current.send('How do I use Moon Maps?');
    });
    expect(state().draft).toBe('How do I use Moon Maps?');
    expect(state().turns).toEqual([]);
    expect(state().notice).toEqual({
      kind: 'message',
      text: 'Too many questions in a short time. Please wait 12 seconds.',
    });
    expect(state().link).toBe('ok');
    await act(() => vi.advanceTimersByTimeAsync(20_000));
    expect(mutateAsync).toHaveBeenCalledTimes(1);
  });

  it('shows the unavailable message on 503 without retrying', async () => {
    mutateAsync.mockRejectedValue(
      new ApiError('assistant_unavailable', 'No model key', 503),
    );
    const chat = setup();
    await act(async () => {
      chat.current.send('Hello');
    });
    await act(() => vi.advanceTimersByTimeAsync(20_000));
    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(state().notice).toEqual({
      kind: 'message',
      text: UNAVAILABLE_MESSAGE,
    });
    expect(state().link).toBe('lost');
    expect(state().turns.at(-1)).toMatchObject({ failed: true });
  });

  it('counts a reply that arrives while the panel is closed as unread', async () => {
    let resolve!: (r: ChatResponse) => void;
    mutateAsync.mockReturnValue(new Promise((r) => (resolve = r)));
    const chat = setup(true);
    await act(async () => {
      chat.current.send('Hello');
    });
    act(() => state().setOpen(false));
    await act(async () => resolve(answer));
    expect(state().unread).toBe(1);
    expect(playChime).toHaveBeenCalledTimes(1);
    act(() => state().setOpen(true));
    expect(state().unread).toBe(0);
  });

  it('does not count a reply seen in the open panel', async () => {
    mutateAsync.mockResolvedValue(answer);
    const chat = setup(true);
    await act(async () => {
      chat.current.send('Hello');
    });
    expect(state().unread).toBe(0);
    expect(playChime).not.toHaveBeenCalled();
  });

  it('Stop drops the pending question back into the input', async () => {
    mutateAsync.mockImplementation(
      ({ signal }: { signal: AbortSignal }) =>
        new Promise((_, reject) =>
          signal.addEventListener('abort', () =>
            reject(new DOMException('stopped', 'AbortError')),
          ),
        ),
    );
    const chat = setup();
    await act(async () => {
      chat.current.send('A long question');
    });
    expect(state().status).toBe('waiting');
    await act(async () => chat.current.stop());
    expect(state().status).toBe('idle');
    expect(state().turns).toEqual([]);
    expect(state().draft).toBe('A long question');
    expect(state().notice).toBeNull();
  });
});
