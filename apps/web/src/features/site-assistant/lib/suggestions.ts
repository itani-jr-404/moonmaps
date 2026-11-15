export type Suggestion = { label: string; text: string };

/**
 * The four suggestion cards of the empty chat. The short label is shown; the full question,
 * which names the site, is sent.
 */
export function siteSuggestions(name: string): Suggestion[] {
  return [
    {
      label: 'When is it next good for landing?',
      text: `When is ${name} next good for landing, with sunlight and the Earth in view?`,
    },
    {
      label: 'How long can a lander stay here?',
      text: `How long can a lander stay at ${name} with sunlight for power?`,
    },
    {
      label: 'Where will the Earth be this week?',
      text: `Where will the Earth be in the sky at ${name} this week?`,
    },
    {
      label: 'How did past missions get here?',
      text: `How did past missions get to ${name} or near it, and how long did the trip take?`,
    },
  ];
}
