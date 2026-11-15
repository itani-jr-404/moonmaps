# Moon Maps

Moon Maps is a 3D web app for the NASA Space Apps Challenge 2026, challenge "Lunar Landing Site Navigator". You pick a landing site on the Moon and a date, and it shows when the site has sunlight (power) and when it can see the Earth (a direct radio link), using real NASA terrain for the horizon (fine maps near the south pole, a global map elsewhere). A chat assistant explains the results. A side-by-side comparison is planned.

Built by team Lunar Titans at the Beirut local event, 14 to 15 November 2026.

## Status

The API is built for the core calculation and is checked against JPL Horizons. The web app is a Next.js site with separate pages: home, choose a landing, planner, sites with a page per site, accuracy, and about. Both are deployed on Vercel from the `main` branch:

- Web app: https://moonmaps.vercel.app
- API: https://moonmaps-api.vercel.app (interactive documentation at https://moonmaps-api.vercel.app/docs)

See [docs/CURRENT_STATE.md](docs/CURRENT_STATE.md) for what is real today.

## Where things are

| Folder | Contents |
| --- | --- |
| [docs/](docs/README.md) | The project documentation: architecture, API, science, frontend, features, decisions, developer guides. Start at [docs/README.md](docs/README.md). |
| [apps/web](apps/web/README.md) | The web app (Next.js, React, TypeScript, three.js) |
| [apps/api](apps/api/README.md) | The API and the calculations (Python, FastAPI, Skyfield) |
| [packages/contracts](packages/contracts/README.md) | The contract between them, generated from the API |
| [research/](research/README.md) | The source material we collected: the challenge page, the official Space Apps guides, the Beirut event page, notes on data sources |
| [team/](team/) | Team notes, the build plan, the stack summary, the idea description |
| [CLAUDE.md](CLAUDE.md) | Rules for AI coding tools working in this repository |

## How it works, in short

1. The API calculates where the Sun and the Earth are in the sky of the chosen site at each moment, from NASA JPL ephemeris files.
2. It builds the horizon around the site from NASA LOLA elevation data.
3. A body is visible when it is higher than the terrain in its direction. The Moon has no atmosphere, so nothing is bent.
4. The web app shows the result: a verdict for a moment, a 30-day calendar, the best windows, a page for each site with a sky forecast, a horizon panorama and an elevation map, and 3D views with the Sun and the Earth where the API places them.

More in [docs/architecture/system-overview.md](docs/architecture/system-overview.md). A one-page summary of the features, the purpose and what sets the project apart is in [docs/product/project-brief.md](docs/product/project-brief.md).

## Running it

You need Node.js 22, pnpm (through `corepack enable`) and uv. From the repository root:

```bash
pnpm install
cd apps/api && uv sync && uv run python scripts/download_data.py && uv run python scripts/precompute_horizons.py
cd ../..
cp apps/web/.env.example apps/web/.env.local
pnpm dev                                          # API on http://localhost:8000 and web app on http://localhost:3000
```

Details and checks: [docs/developer/getting-started.md](docs/developer/getting-started.md).

## Two rules for every contributor

1. **Cite your sources.** Any fact, number, dataset, formula, code or image that comes from somewhere else is recorded with where it came from. See [CLAUDE.md](CLAUDE.md) and [docs/reference/references.md](docs/reference/references.md).
2. **Update the documentation with every change.** A change is not finished until the documents that describe it are correct again.

## Team

Ali Al Itani, Leonardo Khayyat, Hussein Alassaad, Sam Abou Zeid, Khalil Dandashli, Hassan Korek.

## Data and credits

Positions come from NASA JPL ephemerides, checked against JPL Horizons. Terrain comes from the Lunar Orbiter Laser Altimeter on NASA's Lunar Reconnaissance Orbiter. Moon surface maps come from NASA's Scientific Visualization Studio (CGI Moon Kit), and 3D models from NASA 3D Resources. The full list, with links and credit lines, is in [docs/data/sources.md](docs/data/sources.md) and [docs/reference/references.md](docs/reference/references.md).

NASA does not endorse this project.

## Use of AI

How AI is used in the product and in building it is recorded in [docs/reference/ai-use.md](docs/reference/ai-use.md).

## Licence

Apache License 2.0. See [LICENSE](LICENSE).
