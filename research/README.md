# Research

Last updated: 2026-11-16.

The source material the team collected, and a record of how each source is used in the project. New research goes here, with where it came from and the date it was read. Sources are also listed in [docs/reference/references.md](../docs/reference/references.md).

## What is in this folder

| Path | What it is | Where it came from |
| --- | --- | --- |
| [challenges/11-lunar-landing-site-navigator.md](challenges/11-lunar-landing-site-navigator.md) | Our challenge page, word for word: details, resources tab, team count | https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/ , read 2026-11-14 |
| [challenges/](challenges/INDEX.md) | All 14 challenges of 2026, with an index | https://www.spaceappschallenge.org/2026/challenges/ , read 2026-11-14 |
| [space-apps-guides/](space-apps-guides/KEY-FACTS.md) | The official participant guides (FAQs, submission, judging and awards, team formation, Space Apps Connect), the terms, the awards and the partner list; `KEY-FACTS.md` is our summary with a source per fact | https://www.spaceappschallenge.org/resources/ and linked pages, read 2026-11-14 |
| [beirut-event.md](beirut-event.md) | The Beirut local event: venue, local lead, team counts, and the local schedule and deliverables | https://www.spaceappschallenge.org/2026/local-events/beirut/ , read 2026-11-14; schedule from the organizers' slides |
| [second-scrape/](second-scrape/) | A second, independent copy of the guides, the Beirut page and our challenge page, used to cross-check the first | Same pages, read 2026-11-14 |
| [future-scope-demos.md](future-scope-demos.md) | The study behind the Future scope illustrations: orbital imaging, fresh craters, landing sensors, the quadtree search and a test of it on the real engine | NASA, LROC, JPL, ISRO, JAXA pages and papers, read 2026-11-15 |
| [data-source-notes.md](data-source-notes.md) | Notes from checking the data sources: the JPL Horizons call that was tested, the LOLA files, the illumination maps | NASA pages, read 2026-11-14 |
| [space-apps-resources.md](space-apps-resources.md) | Notes from writing the assistant's knowledge files: the challenge resources, the general Space Apps resources, the Beirut page and mission pages, and what could not be read | spaceappschallenge.org, NASA, CSA and ISRO pages, read 2026-11-15 |
| [error-study.md](error-study.md) | Error budget of the app's answers and the proposed KPIs, with the scripts and data behind every number | JPL Horizons API, IERS, NASA NSSDCA fact sheets, LOLA grids, NASA Goddard PGDA maps; read and run 2026-11-15 |

The pages were saved because the Space Apps site builds its content in the browser and may change or close after the event.

## Every resource the team gathered, and how it is used

| Resource | Used? | Where |
| --- | --- | --- |
| Challenge statement: background, objectives, potential considerations | Yes | [docs/product/challenge-coverage.md](../docs/product/challenge-coverage.md) maps every item to a feature |
| Challenge resources tab: Quickmap, Moon Trek, JPL Horizons, Canadian Space Agency portal | Yes, all four | [docs/data/sources.md](../docs/data/sources.md) |
| Participant guides: submission, judging, team formation, FAQs, terms | Yes | [docs/hackathon/rules-and-submission.md](../docs/hackathon/rules-and-submission.md), [docs/hackathon/judging-criteria.md](../docs/hackathon/judging-criteria.md) |
| Beirut event page | Yes | [beirut-event.md](beirut-event.md) |
| Organizers' slides: schedule, needed tasks, what to submit, judging criteria | Yes | [docs/hackathon/local-schedule-and-deliverables.md](../docs/hackathon/local-schedule-and-deliverables.md), [docs/hackathon/judging-criteria.md](../docs/hackathon/judging-criteria.md) |
| A plain-language summary of the challenge (the problem, the mission, what to build, who uses it) | Yes | [docs/product/overview.md](../docs/product/overview.md). Its claims were checked against the challenge page before use. |
| An earlier product vision document for the same idea | Partly | Its feature ideas are in [docs/features/README.md](../docs/features/README.md): presets, tooltips, the delay simulation, data export. Its specific numbers were not copied because they had no sources. |
| React Bits, https://reactbits.dev/get-started/index | Yes | [docs/frontend/landing-page.md](../docs/frontend/landing-page.md), [docs/frontend/design-system.md](../docs/frontend/design-system.md) |
| Prompt Motion, https://www.promptsmotion.com | Yes | Reference for the landing page scenes and the demo video; [docs/reference/references.md](../docs/reference/references.md) |
| A reference landing page (scroll structure and animation) | Yes, as a pattern only | [docs/frontend/landing-page.md](../docs/frontend/landing-page.md). The page itself is not copied into the repository. |
| A reference picture of the Solar System | Yes, as a visual reference only | [docs/frontend/3d-scenes.md](../docs/frontend/3d-scenes.md), scene 1. The picture is not in the repository because its licence is unknown; the app uses NASA imagery. |
| A component library from a team member's earlier app | Yes, as a pattern | [docs/frontend/design-system.md](../docs/frontend/design-system.md): glass panels, stat tiles, segmented control, chart frames |
| The other 13 challenges | No | Kept for reference only; we answer one challenge |
| Space Apps Connect guide | Not yet | Use it to ask NASA's experts about data questions during the event |

## Claims still to confirm

Items written from memory or from a product page, not yet checked against the real file or a primary source, are listed in [docs/CURRENT_STATE.md](../docs/CURRENT_STATE.md) under "To confirm before relying on it".

## Adding research

1. Save or summarise what you found in this folder, in a file named for its subject.
2. At the top, write the address, the owner, and the date you read it.
3. Add the source to [docs/reference/references.md](../docs/reference/references.md).
4. Link to it from the document that uses it.
