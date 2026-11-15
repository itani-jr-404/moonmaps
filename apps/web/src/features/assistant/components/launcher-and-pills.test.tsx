import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatStore } from '../hooks/use-chat-store';
import { FloatingPills } from './floating-pills';
import { Launcher } from './launcher';

beforeEach(() => {
  useChatStore.setState(useChatStore.getInitialState(), true);
});
afterEach(cleanup);

describe('FloatingPills', () => {
  it('sends the tapped question', () => {
    const onAsk = vi.fn();
    render(<FloatingPills ready onAsk={onAsk} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Is this spot good right now?' }),
    );
    expect(onAsk).toHaveBeenCalledWith('Is this spot good right now?');
  });

  it('shows at most two questions and can be hidden', () => {
    render(<FloatingPills ready onAsk={() => {}} />);
    const group = screen.getByRole('group', { name: 'Suggested questions' });
    // Two questions plus the hide button.
    expect(group.querySelectorAll('button')).toHaveLength(3);
    fireEvent.click(
      screen.getByRole('button', { name: 'Hide suggested questions' }),
    );
    expect(screen.queryByRole('group')).toBeNull();
  });

  it('stays hidden once the panel has been opened, and before the intro ends', () => {
    const { rerender } = render(
      <FloatingPills ready={false} onAsk={() => {}} />,
    );
    expect(screen.queryByRole('group')).toBeNull();
    act(() => useChatStore.getState().setOpen(true));
    rerender(<FloatingPills ready onAsk={() => {}} />);
    expect(screen.queryByRole('group')).toBeNull();
  });
});

describe('Launcher', () => {
  const renderLauncher = (open = false) =>
    render(
      <Launcher
        ref={createRef()}
        ready
        open={open}
        controls="panel"
        onToggle={() => {}}
      />,
    );

  it('shows a steady status dot with nothing unread', () => {
    renderLauncher();
    const light = screen.getByTestId('assistant-light');
    expect(light.dataset.unread).toBe('false');
    expect(light.textContent).toBe('');
    expect(
      screen
        .getByRole('button', { name: 'Ask the Moon Maps assistant' })
        .getAttribute('aria-expanded'),
    ).toBe('false');
  });

  it('shows the unread count in the dot, capped at 9+', () => {
    useChatStore.setState({ unread: 1 });
    const { unmount } = renderLauncher();
    expect(screen.getByTestId('assistant-light').textContent).toBe('1');
    expect(
      screen.getByRole('button', {
        name: 'Ask the Moon Maps assistant, 1 new answer',
      }),
    ).toBeTruthy();
    unmount();
    useChatStore.setState({ unread: 12 });
    renderLauncher();
    const light = screen.getByTestId('assistant-light');
    expect(light.dataset.unread).toBe('true');
    expect(light.textContent).toBe('9+');
  });

  it('hides the count while the panel is open', () => {
    useChatStore.setState({ unread: 3 });
    renderLauncher(true);
    expect(screen.getByTestId('assistant-light').textContent).toBe('');
  });
});
