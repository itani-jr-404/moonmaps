# Current state

Last updated: 2026-11-14, about 16:20 Beirut time.

This file says what is real today. Update it in every pull request that builds, removes or postpones something.

## Summary

The design is written (these documents) and the repository is set up. A prototype of the web app, with its designs, exists outside the repository and has not been brought into `apps/web` yet. No part of the API is built.

## Built

| Part | State |
| --- | --- |
| Repository | Set up: structure, documents, rules, licence |
| CI | Runs on every pull request and on `main`. The documentation link check runs now; the web and API checks start by themselves once those folders hold a project. See [developer/testing.md](developer/testing.md). |
| Web: prototype | Exists outside the repository; to be moved into `apps/web` and described here |
| API: ephemeris engine | Not started |
| API: terrain and horizon engine | Not started |
| API: metrics, endpoints | Not started |
| API: assistant | Not started |
| Web: app shell, design system | Not started |
| Web: panorama, timeline, metrics | Not started |
| Web: 3D scenes | Not started |
| Web: landing page | Not started |
| Deployment | Not started |

## Decided

See [decisions/](decisions/README.md) for the reasons.

- Next.js web app, Python FastAPI backend, one monorepo with a generated contract.
- Positions are calculated live with Skyfield; JPL Horizons is the reference we test against.
- The horizon comes from LOLA elevation grids; visibility is the body's centre against the terrain horizon.
- No login and no database.
- The assistant answers from a knowledge base and from the API. Retrieval is added only if the knowledge base grows.

## Open questions

| Question | Who decides | Blocks |
| --- | --- | --- |
| How the prototype's screens and stack line up with the design in these documents | Team, when the prototype is brought in | Web app |
| Which AI model runs the assistant | Team | Assistant service only; the interface is fixed |
| Thresholds for go, caution and no-go | Team, after seeing real numbers | Badges |
| Textures for the planets other than Earth and Moon, and their licence | Whoever builds the Solar System scene | Solar System scene |
| Which host runs the API container | Whoever deploys | Deployment |
| Final curated site list with confirmed coordinates | Site curator | Site picker, accuracy page |

## To confirm before relying on it

These are written in the docs from memory or from a product page, not from running code.

- Layout of the LOLA `.IMG` files (sample type, byte order, scale factor, projection offsets). Read the `.LBL` file. See [science/terrain-and-horizon.md](science/terrain-and-horizon.md).
- Skyfield kernel file names and the frame name `MOON_ME_DE421`. See [science/conventions-and-ephemeris.md](science/conventions-and-ephemeris.md).
- Layout and units of the global elevation files in NASA's CGI Moon Kit.
- Coordinates in the starter site list. See [data/sites.md](data/sites.md).

## Known limits of the design

- Dates are limited to what the DE421 kernel covers, about 1900 to 2050.
- Shadows in the 3D site view come from terrain inside the loaded tile only. Blocking by distant terrain is applied through the horizon profile, not through the mesh.
- For sites far from the south pole the horizon uses a much coarser global elevation map.
