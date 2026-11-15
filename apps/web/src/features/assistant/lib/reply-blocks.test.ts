import { describe, expect, it } from 'vitest';
import { replyBlocks } from './reply-blocks';

describe('replyBlocks', () => {
  it('keeps line breaks inside a paragraph and splits on blank lines', () => {
    expect(replyBlocks('One\nTwo\n\nThree')).toEqual([
      { kind: 'p', text: 'One\nTwo' },
      { kind: 'p', text: 'Three' },
    ]);
  });

  it('turns "- " lines into a bulleted list', () => {
    expect(
      replyBlocks('Sites:\n- Haworth\n- Mons Mouton\nThat is all.'),
    ).toEqual([
      { kind: 'p', text: 'Sites:' },
      { kind: 'ul', items: ['Haworth', 'Mons Mouton'] },
      { kind: 'p', text: 'That is all.' },
    ]);
  });

  it('turns "1. " lines into a numbered list, across blank lines', () => {
    expect(replyBlocks('1. Pick a site\n\n2. Pick a time')).toEqual([
      { kind: 'ol', items: ['Pick a site', 'Pick a time'], start: 1 },
    ]);
  });

  it('does not treat a negative number as a list', () => {
    expect(replyBlocks('-89.5 degrees')).toEqual([
      { kind: 'p', text: '-89.5 degrees' },
    ]);
  });

  it('returns nothing for empty text', () => {
    expect(replyBlocks('')).toEqual([]);
  });
});
