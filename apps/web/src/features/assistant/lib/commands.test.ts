import { describe, expect, it } from 'vitest';
import { matchCommands, SLASH_COMMANDS } from './commands';

describe('matchCommands', () => {
  it('lists every command for a lone slash', () => {
    expect(matchCommands('/')).toEqual(SLASH_COMMANDS);
  });

  it('filters by what was typed', () => {
    expect(matchCommands('/pl')!.map((c) => c.name)).toEqual(['/planner']);
    expect(matchCommands('/A')!.map((c) => c.name)).toEqual([
      '/accuracy',
      '/about',
    ]);
    expect(matchCommands('/ab')!.map((c) => c.name)).toEqual(['/about']);
    expect(matchCommands('/zzz')).toEqual([]);
  });

  it('opens pages of the app', () => {
    const href = (name: string) => {
      const action = SLASH_COMMANDS.find((c) => c.name === name)!.action;
      return action.kind === 'route' ? action.href : null;
    };
    expect(href('/planner')).toBe('/planner');
    expect(href('/landing')).toBe('/explore');
    expect(href('/why')).toBe('/#why');
    expect(href('/about')).toBe('/about');
    expect(href('/sites')).toBe('/sites');
    expect(href('/accuracy')).toBe('/accuracy');
  });

  it('stays shut for questions', () => {
    expect(matchCommands('')).toBeNull();
    expect(matchCommands('what is /planner')).toBeNull();
    expect(matchCommands('/planner please')).toBeNull();
    expect(matchCommands('/new\n')).toBeNull();
  });
});
