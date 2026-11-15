/**
 * Official links for the "NASA resources" screen of the assistant panel. Every address is copied
 * from the assistant's own documents, which list their sources:
 * apps/api/app/data/knowledge/challenge.md and apps/api/app/data/knowledge/space-apps.md
 * (read 2026-11-15). Nothing here comes from anywhere else.
 */
export type Resource = { title: string; owner: string; href: string };
export type ResourceGroup = { title: string; items: Resource[] };

export const NASA_RESOURCES: ResourceGroup[] = [
  {
    title: 'The challenge',
    items: [
      // challenge.md, source 1: "Lunar Landing Site Navigator", NASA Space Apps Challenge 2026.
      {
        title: 'Lunar Landing Site Navigator',
        owner: 'NASA Space Apps',
        href: 'https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/',
      },
      // challenge.md, source 1: the challenge's Resources tab.
      {
        title: 'Challenge resources',
        owner: 'NASA Space Apps',
        href: 'https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/?tab=resources',
      },
      // challenge.md, "Official challenge resources" table and source 3.
      {
        title: 'Moon Trek',
        owner: 'NASA',
        href: 'https://trek.nasa.gov/moon/',
      },
      // challenge.md, "Official challenge resources" table and source 4.
      {
        title: 'Horizons System',
        owner: 'NASA JPL',
        href: 'https://ssd.jpl.nasa.gov/horizons/',
      },
    ],
  },
  {
    title: 'Space Apps guides',
    items: [
      // space-apps.md, source 1: "Resources".
      {
        title: 'All resources',
        owner: 'NASA Space Apps',
        href: 'https://www.spaceappschallenge.org/resources/',
      },
      // space-apps.md, source 2: "Participant FAQs".
      {
        title: 'Participant FAQs',
        owner: 'NASA Space Apps',
        href: 'https://www.spaceappschallenge.org/resources/participant-faqs/',
      },
      // space-apps.md, source 4: "Project Submission Guide".
      {
        title: 'Project Submission Guide',
        owner: 'NASA Space Apps',
        href: 'https://www.spaceappschallenge.org/resources/project-submission-guide/',
      },
      // space-apps.md, source 5: "Judging & Awards Guide".
      {
        title: 'Judging & Awards Guide',
        owner: 'NASA Space Apps',
        href: 'https://www.spaceappschallenge.org/resources/judging-awards-guide/',
      },
    ],
  },
];
