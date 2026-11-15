/** What a slash command does. */
export type CommandAction =
  { kind: 'section'; id: string } | { kind: 'resources' } | { kind: 'new' };

export type SlashCommand = {
  name: string;
  description: string;
  action: CommandAction;
};

/** Shortcuts typed in the input. Section ids are the page sections' own. */
export const SLASH_COMMANDS: readonly SlashCommand[] = [
  {
    name: '/planner',
    description: 'Go to the planner',
    action: { kind: 'section', id: 'navigator' },
  },
  {
    name: '/landing',
    description: 'Go to Choose a landing',
    action: { kind: 'section', id: 'land' },
  },
  {
    name: '/why',
    description: 'Go to Why the pole',
    action: { kind: 'section', id: 'why' },
  },
  {
    name: '/about',
    description: 'Go to About',
    action: { kind: 'section', id: 'about' },
  },
  {
    name: '/resources',
    description: 'Open the Resources tab',
    action: { kind: 'resources' },
  },
  { name: '/new', description: 'Start a new chat', action: { kind: 'new' } },
];

/**
 * The commands matching the input, or null when the menu should stay shut: the input must start
 * with "/" and be a single word (a space or a new line means it is a question).
 */
export function matchCommands(input: string): SlashCommand[] | null {
  if (!/^\/\S*$/.test(input)) return null;
  const typed = input.toLowerCase();
  return SLASH_COMMANDS.filter((c) => c.name.startsWith(typed));
}
