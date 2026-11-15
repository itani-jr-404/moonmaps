import { describe, expect, it } from 'vitest';
import { canScroll, scrollableBetween } from './use-contain-scroll';

function box(scrollTop: number, clientHeight: number, scrollHeight: number) {
  const el = document.createElement('div');
  el.style.overflowY = 'auto';
  Object.defineProperty(el, 'clientHeight', { value: clientHeight });
  Object.defineProperty(el, 'scrollHeight', { value: scrollHeight });
  Object.defineProperty(el, 'scrollTop', { value: scrollTop });
  // Computed styles only exist for elements in the document.
  document.body.append(el);
  return el;
}

describe('scroll containment', () => {
  it('knows when a list can still move', () => {
    expect(canScroll(box(0, 100, 300), 50)).toBe(true);
    expect(canScroll(box(0, 100, 300), -50)).toBe(false);
    expect(canScroll(box(200, 100, 300), 50)).toBe(false);
    expect(canScroll(box(0, 100, 100), 50)).toBe(false);
  });

  it('finds the scrollable list under the pointer, and nothing over the header', () => {
    const panel = document.createElement('div');
    const header = document.createElement('header');
    const log = box(10, 100, 300);
    const line = document.createElement('p');
    log.append(line);
    panel.append(header, log);
    document.body.append(panel);
    expect(scrollableBetween(line, panel, 40)).toBe(log);
    expect(scrollableBetween(header, panel, 40)).toBeNull();
    panel.remove();
  });
});
