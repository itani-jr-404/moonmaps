/** What a slash command does. */
export type CommandAction =
  { kind: 'route'; href: string } | { kind: 'resources' } | { kind: 'new' };

export type SlashCommand = {
  name: string;
  description: string;
  action: CommandAction;
};

/** Shortcuts typed in the input. Route commands open a page of the app ("/#why" is a section of the home page). */
export const SLASH_COMMANDS: readonly SlashCommand[] = [
  {
    name: '/planner',
    description: 'Open the planner',
    action: { kind: 'route', href: '/planner' },
  },
  {
    name: '/landing',
    description: 'Open Choose a landing',
    action: { kind: 'route', href: '/explore' },
  },
  {
    name: '/sites',
    description: 'Open the landing sites',
    action: { kind: 'route', href: '/sites' },
  },
  {
    name: '/accuracy',
    description: 'Open How accurate it is',
    action: { kind: 'route', href: '/accuracy' },
  },
  {
    name: '/why',
    description: 'Go to Why the pole',
    action: { kind: 'route', href: '/#why' },
  },
  {
    name: '/about',
    description: 'Open About',
    action: { kind: 'route', href: '/about' },
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
