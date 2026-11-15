import { describe, expect, it } from 'vitest';
import { matchCommands, SLASH_COMMANDS } from './commands';

describe('matchCommands', () => {
  it('lists every command for a lone slash', () => {
    expect(matchCommands('/')).toEqual(SLASH_COMMANDS);
  });

  it('filters by what was typed', () => {
    expect(matchCommands('/pl')!.map((c) => c.name)).toEqual(['/planner']);
    expect(matchCommands('/A')!.map((c) => c.name)).toEqual(['/about']);
    expect(matchCommands('/zzz')).toEqual([]);
  });

  it('stays shut for questions', () => {
    expect(matchCommands('')).toBeNull();
    expect(matchCommands('what is /planner')).toBeNull();
    expect(matchCommands('/planner please')).toBeNull();
    expect(matchCommands('/new\n')).toBeNull();
  });
});
