/**
 * Links for the "Resources" tab of the assistant panel: only NASA tools a visitor can use to look
 * further into what Moon Maps shows. Every address and description is copied from the assistant's
 * own document apps/api/app/data/knowledge/challenge.md ("Official challenge resources" table,
 * sources 3 and 4, read 2026-11-15), which lists where each came from. The same two addresses are
 * entries 14 and 2 of docs/reference/references.md. Nothing here comes from anywhere else.
 */
export type Resource = {
  title: string;
  owner: string;
  /** What a visitor can do there, in one line. */
  note: string;
  href: string;
};
export type ResourceGroup = { title: string; items: Resource[] };

export const NASA_RESOURCES: ResourceGroup[] = [
  {
    title: 'NASA tools',
    items: [
      // challenge.md, "Official challenge resources" table and source 3.
      {
        title: 'Moon Trek',
        owner: 'NASA',
        note: 'Browse NASA maps of the Moon, including 3D views.',
        href: 'https://trek.nasa.gov/moon/',
      },
      // challenge.md, "Official challenge resources" table and source 4.
      {
        title: 'Horizons System',
        owner: 'NASA JPL',
        note: 'Positions of the Sun and the Earth seen from a point on the Moon.',
        href: 'https://ssd.jpl.nasa.gov/horizons/',
      },
    ],
  },
];
