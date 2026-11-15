# Decision records

Last updated: 2026-11-15.

Each record states one decision, why it was made, and what follows from it. A record is not edited once accepted; if the decision changes, a new record replaces it and the old one is marked "Replaced by".

| # | Decision | Status |
| --- | --- | --- |
| [ADR-001](ADR-001-python-backend.md) | The calculations run in a Python backend | Accepted |
| [ADR-002](ADR-002-live-calculation.md) | Positions are calculated live; horizons are cached | Accepted |
| [ADR-003](ADR-003-monorepo-and-contract.md) | One repository with a generated contract | Accepted |
| [ADR-004](ADR-004-horizon-profile.md) | The horizon is a 360-value profile built from LOLA grids | Accepted |
| [ADR-005](ADR-005-visibility-by-disc-centre.md) | A body is visible when its centre is above the terrain | Accepted |
| [ADR-006](ADR-006-3d-shadows-and-distant-terrain.md) | 3D shadows come from the tile; distant terrain comes from the profile | Accepted |
| [ADR-007](ADR-007-assistant.md) | The assistant uses a knowledge base first, behind a model interface | Accepted |
| [ADR-008](ADR-008-no-login-no-database.md) | No login and no database; the URL holds the scenario | Accepted |
| [ADR-009](ADR-009-columnar-series.md) | Time series are sent as parallel arrays | Accepted |
| [ADR-010](ADR-010-threejs-directly.md) | three.js is used directly, not through React Three Fiber | Accepted |
| [ADR-011](ADR-011-sky-endpoint.md) | A `/sky` endpoint for single moments; the web app never computes positions | Accepted |
| [ADR-012](ADR-012-visual-styling.md) | Tailwind tokens plus CSS modules for complex effects; no shadcn/ui yet | Accepted |
| [ADR-013](ADR-013-assistant-model.md) | The assistant chains free model providers (NVIDIA, Groq, Gemini, Cloudflare, SambaNova, OpenRouter, Cohere) behind an OpenAI-compatible client | Accepted |
| [ADR-014](ADR-014-calibration.md) | A small ridge regression, trained on NASA's polar maps and tested by cross-validation, measures how much learning from past data reduces our long-term error; it is reported, not applied to 30-day results | Accepted |
| [ADR-015](ADR-015-global-terrain-grid.md) | The global LOLA grid at 16 pixels per degree gives every site outside the polar grids a terrain horizon | Accepted |
| [ADR-016](ADR-016-landed-view-real-skyline.md) | The landed view draws the API's terrain horizon as its skyline | Accepted |

## Template

```markdown
# ADR-NNN: Title

Status: Proposed | Accepted | Replaced by ADR-NNN. Date: YYYY-MM-DD.

## Context
What problem or question made a decision necessary.

## Decision
What we decided, in one or two sentences.

## Consequences
What becomes easier, what becomes harder, what we must remember.

## Alternatives considered
Each alternative and why it was not chosen.
```
