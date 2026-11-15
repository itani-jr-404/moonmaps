import { describe, expect, it } from 'vitest';
import { MAX_MS, MIN_CPS, typedLength, typedText, typeSpeed } from './type-out';

describe('typeSpeed', () => {
  it('never goes below the minimum speed', () => {
    expect(typeSpeed(10)).toBe(MIN_CPS);
  });

  it('speeds up so a long answer still ends in time', () => {
    const total = 5000;
    expect((total / typeSpeed(total)) * 1000).toBeCloseTo(MAX_MS);
  });
});

describe('typedLength', () => {
  it('starts empty and grows with time', () => {
    expect(typedLength(200, 0)).toBe(0);
    expect(typedLength(200, 500)).toBe(Math.floor(0.5 * MIN_CPS));
  });

  it('never passes the end of the text', () => {
    expect(typedLength(200, 60_000)).toBe(200);
    expect(typedLength(4000, MAX_MS)).toBe(4000);
  });

  it('shows everything at once with reduced motion', () => {
    expect(typedLength(200, 0, true)).toBe(200);
  });

  it('handles an empty text', () => {
    expect(typedLength(0, 100)).toBe(0);
  });
});

describe('typedText', () => {
  const text = 'Sun above the horizon at https://science.nasa.gov/moon/ today';

  it('cuts back to the last whole word', () => {
    expect(typedText(text, 6)).toBe('Sun');
    expect(typedText(text, 3)).toBe('Sun');
  });

  it('never shows half a link', () => {
    const shown = typedText(text, 40);
    expect(shown).toBe('Sun above the horizon at');
  });

  it('returns the full text at the end and nothing at the start', () => {
    expect(typedText(text, text.length)).toBe(text);
    expect(typedText(text, 0)).toBe('');
  });
});
