import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { PageTransition, resetPageTransitionForTests } from './page-transition';

afterEach(cleanup);
beforeEach(resetPageTransitionForTests);

const wrapper = () =>
  screen.getByText('page').closest('[data-page]') as HTMLElement;

describe('PageTransition', () => {
  it('does not fade the first page the site loads', () => {
    render(<PageTransition>page</PageTransition>);
    expect(wrapper().className).toBe('');
  });

  it('fades the pages opened after the first one', () => {
    const first = render(<PageTransition>first</PageTransition>);
    first.unmount();
    render(<PageTransition>page</PageTransition>);
    expect(wrapper().className).toMatch(/rise/);
  });
});
