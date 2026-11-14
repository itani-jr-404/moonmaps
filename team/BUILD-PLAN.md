# Build plan

Last updated: 2026-11-14, 15:15 Beirut time. For the team to adjust.

The design is in [docs/](../docs/README.md). The times we have to meet are in [docs/hackathon/local-schedule-and-deliverables.md](../docs/hackathon/local-schedule-and-deliverables.md). This file is only the order of work.

## The fixed points

| When | What must exist |
| --- | --- |
| Sat 8:30 PM | Idea validation submitted (format to confirm with the organizers) |
| Sun 11:00 AM | Final level: the team is online and the app runs at a public address |
| Sun 3:00 PM | Semi finals: a live demonstration |
| Sun 7:00 PM | Presentation submitted |
| Sun 11:59 PM | Project submitted on spaceappschallenge.org. Aim for 10:30 PM. |

## Starting point

A prototype of the web app, with its designs, already exists. It moves into `apps/web` first, and its screens are matched to the views in [docs/frontend/routes-and-state.md](../docs/frontend/routes-and-state.md). Anything the prototype does differently from the documents is settled now: either the code changes or the document does.

## Order of work

Each step leaves something that runs.

| Step | Target | Result |
| --- | --- | --- |
| 1. Foundations | Sat 5:00 PM | Prototype in `apps/web`. API skeleton with `/health`. The contract file and generated types. Mock data in the contract's shape. Data files downloaded. |
| 2. Positions | Sat 7:30 PM | The API returns the Sun's and the Earth's azimuth and elevation for a site and a range. A table shows they match JPL Horizons for two sites. This table is our idea validation. |
| 3. Core path on real data | Sat night | Terrain horizon, visibility, windows and metrics from the API. Panorama, timeline and metric tiles in the app, on real data. |
| 4. 3D | Sun 10:00 AM | Moon globe with site pins. Site view with terrain and moving shadows. |
| 5. Online | Sun 11:00 AM | Both parts deployed at public addresses. Fallback data in place. |
| 6. Comparison and accuracy page | Sun 12:30 PM | Up to four scenarios side by side. The accuracy page. |
| 7. Freeze | Sun 1:00 PM | No new features. Fix, polish, rehearse the demonstration. |
| 8. Semi finals | Sun 3:00 PM | Live demonstration. |
| 9. Deliverables | Sun 3:30 to 7:00 PM | Presentation (due 7:00 PM), 2-minute video, 30-second video, research and sources posted on Slack. |
| 10. Submission | Sun 7:00 to 10:30 PM | Project page filled in, links tested in a private window, references and AI use complete, submitted. |

The landing page, the Solar System view and the assistant are built alongside steps 3 to 6 by whoever is free, and none of them blocks the core path.

## If we run late, cut in this order

1. The Solar System view.
2. The assistant.
3. Animation on the landing page (keep it as a still page).
4. Cast shadows in the site view (keep the light going on and off with the Sun).

The core path (site, date, panorama, timeline, metrics, comparison) and the accuracy page are never cut.

## Work streams

Names are assigned by the team. Six streams for six people.

| Stream | Covers |
| --- | --- |
| A. Lead and metrics | Repository, contract, visibility and metrics, deployment, unblocking |
| B. Positions | Ephemeris engine, the JPL Horizons comparison, the accuracy page's data |
| C. Terrain | Reading the elevation grid, the horizon profile, the terrain tile, the cache |
| D. App | App shell, site list, time slider, panorama, timeline, metric tiles, comparison |
| E. 3D and landing | Moon globe, site view, Solar System, landing page |
| F. Content | The site list with confirmed coordinates, the assistant's documents, citations, the presentation and the videos |

## Standing rules

- Everyone writes at least one test for their own code.
- Calculations are checked against JPL Horizons, by someone other than the author where possible.
- Sources are cited, and the documents are updated with each change. See [CLAUDE.md](../CLAUDE.md).
- The frontend and the backend connect early and keep connecting; nobody waits until Sunday to integrate.
