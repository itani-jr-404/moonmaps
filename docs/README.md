# Moon Maps documentation

Moon Maps is a 3D web app for the NASA Space Apps 2026 challenge "Lunar Landing Site Navigator". You pick a landing site on the Moon and a date, and it shows when the site has sunlight and when it can see the Earth, using real terrain for the horizon.

These documents describe the design we are building towards. Nothing here is built yet unless [CURRENT_STATE.md](CURRENT_STATE.md) says so.

## Start here

| If you want to | Read |
| --- | --- |
| Know what exists today | [CURRENT_STATE.md](CURRENT_STATE.md) |
| Explain the project in one page (features, purpose, what sets it apart) | [product/project-brief.md](product/project-brief.md) |
| Understand what the app is for | [product/overview.md](product/overview.md) |
| Understand the whole system in ten minutes | [architecture/system-overview.md](architecture/system-overview.md) |
| Start coding | [developer/getting-started.md](developer/getting-started.md), then [developer/conventions.md](developer/conventions.md) |
| Work on the API or the calculations | [backend/api-reference.md](backend/api-reference.md), then the `science/` folder |
| Work on the web app | [frontend/routes-and-state.md](frontend/routes-and-state.md), then [frontend/3d-scenes.md](frontend/3d-scenes.md) |
| Use an AI coding tool on this repo | [AI_CONTEXT.md](AI_CONTEXT.md) |

## Documentation map

| Folder | Contents |
| --- | --- |
| [product/](product/) | [project-brief](product/project-brief.md), [overview](product/overview.md), [challenge-coverage](product/challenge-coverage.md) |
| [architecture/](architecture/) | [system-overview](architecture/system-overview.md), [repository-structure](architecture/repository-structure.md), [application-layers](architecture/application-layers.md), [request-lifecycle](architecture/request-lifecycle.md) |
| [backend/](backend/) | [api-reference](backend/api-reference.md), [service-layer](backend/service-layer.md), [assistant](backend/assistant.md) |
| [science/](science/) | [conventions-and-ephemeris](science/conventions-and-ephemeris.md), [terrain-and-horizon](science/terrain-and-horizon.md), [visibility-and-metrics](science/visibility-and-metrics.md), [validation](science/validation.md) |
| [frontend/](frontend/) | [routes-and-state](frontend/routes-and-state.md), [3d-scenes](frontend/3d-scenes.md), [landing-page](frontend/landing-page.md), [design-system](frontend/design-system.md) |
| [features/](features/) | [Feature list with status](features/README.md) |
| [data/](data/) | [sources](data/sources.md), [sites](data/sites.md) |
| [decisions/](decisions/) | [Decision records](decisions/README.md) |
| [developer/](developer/) | [getting-started](developer/getting-started.md), [conventions](developer/conventions.md), [testing](developer/testing.md), [deployment](developer/deployment.md) |
| [reference/](reference/) | [glossary](reference/glossary.md), [references](reference/references.md), [ai-use](reference/ai-use.md) |
| [hackathon/](hackathon/) | [rules-and-submission](hackathon/rules-and-submission.md), [local-schedule-and-deliverables](hackathon/local-schedule-and-deliverables.md), [judging-criteria](hackathon/judging-criteria.md) |

## Source-of-truth policy

- The API contract is `packages/contracts/openapi.json`, generated from the backend's Pydantic models. If [backend/api-reference.md](backend/api-reference.md) and the generated file disagree, the generated file is right and the document must be fixed.
- Units and sign conventions are defined once, in [science/conventions-and-ephemeris.md](science/conventions-and-ephemeris.md). No other document restates them differently.
- What is built is recorded in [CURRENT_STATE.md](CURRENT_STATE.md) and in the status column of [features/README.md](features/README.md). The other documents describe the target design.
- A decision that changes the design gets a record in [decisions/](decisions/) before the code changes.

## Keeping these documents current

The repository has two standing rules, stated in [CLAUDE.md](../CLAUDE.md): cite every source, and update the documentation with every change.

A change is not finished until:

1. The document that describes the changed part is updated in the same pull request.
2. [CURRENT_STATE.md](CURRENT_STATE.md) and the feature status are updated if something was built, removed or postponed.
3. Anything written as "to confirm" that the change confirmed has the note removed and the confirmed value written in, with its source.
4. Every source used is cited where it is used and listed in [reference/references.md](reference/references.md).

Every document starts with a status line (`Design`, `Partly built` or `Built`) and the date it was last updated.
