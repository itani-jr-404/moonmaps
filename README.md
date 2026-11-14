# Moon Maps

Moon Maps is a 3D web app for the NASA Space Apps Challenge 2026, challenge "Lunar Landing Site Navigator". You pick a landing site on the Moon and a date, and it shows when the site has sunlight (power) and when it can see the Earth (a direct radio link), using real NASA terrain for the horizon. Sites and dates can be compared side by side, and a chat assistant explains the results.

Built by team Lunar Titans at the Beirut local event, 14 to 15 November 2026.

## Status

The design is written and the repository is set up. A first prototype of the web app exists and is being brought into `apps/web`. See [docs/CURRENT_STATE.md](docs/CURRENT_STATE.md) for what is real today.

## Where things are

| Folder | Contents |
| --- | --- |
| [docs/](docs/README.md) | The project documentation: architecture, API, science, frontend, features, decisions, developer guides. Start at [docs/README.md](docs/README.md). |
| `apps/web` | The web app (Next.js, React, TypeScript, three.js) |
| `apps/api` | The API and the calculations (Python, FastAPI, Skyfield) |
| `packages/contracts` | The contract between them, generated from the API |
| [research/](research/README.md) | The source material we collected: the challenge page, the official Space Apps guides, the Beirut event page, notes on data sources |
| [team/](team/) | Team notes, the build plan, the stack summary, the idea description |
| [CLAUDE.md](CLAUDE.md) | Rules for AI coding tools working in this repository |

## How it works, in short

1. The API calculates where the Sun and the Earth are in the sky of the chosen site at each moment, from NASA JPL ephemeris files.
2. It builds the horizon around the site from NASA LOLA elevation data.
3. A body is visible when it is higher than the terrain in its direction. The Moon has no atmosphere, so nothing is bent.
4. The web app draws the result: a panorama of the horizon, a timeline, metrics, a comparison, and 3D scenes lit by the Sun where it really is.

More in [docs/architecture/system-overview.md](docs/architecture/system-overview.md).

## Running it

See [docs/developer/getting-started.md](docs/developer/getting-started.md).

## Two rules for every contributor

1. **Cite your sources.** Any fact, number, dataset, formula, code or image that comes from somewhere else is recorded with where it came from. See [CLAUDE.md](CLAUDE.md) and [docs/reference/references.md](docs/reference/references.md).
2. **Update the documentation with every change.** A change is not finished until the documents that describe it are correct again.

## Team

Ali Al Itani, Leonardo Khayyat, Hussein Alassaad, Sam Abou Zeid, Khalil Dandashli, Hassan Korek.

## Data and credits

Positions come from NASA JPL ephemerides, checked against JPL Horizons. Terrain comes from the Lunar Orbiter Laser Altimeter on NASA's Lunar Reconnaissance Orbiter. Surface maps come from NASA's Scientific Visualization Studio (CGI Moon Kit) and NASA's Blue Marble. The full list, with links and credit lines, is in [docs/data/sources.md](docs/data/sources.md) and [docs/reference/references.md](docs/reference/references.md).

NASA does not endorse this project.

## Use of AI

How AI is used in the product and in building it is recorded in [docs/reference/ai-use.md](docs/reference/ai-use.md).

## Licence

Apache License 2.0. See [LICENSE](LICENSE).
