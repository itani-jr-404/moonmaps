# CLAUDE.md

Guidance for Claude Code and any other AI coding tool working in this repository. Humans on the team follow the same rules.

## What this is

Moon Maps: a 3D web app for the NASA Space Apps Challenge 2026, challenge "Lunar Landing Site Navigator". For a site on the Moon and a time range, it shows when the Sun and the Earth are above the terrain horizon, compares scenarios, and explains the result through a chat assistant.

Read [docs/AI_CONTEXT.md](docs/AI_CONTEXT.md) next, then [docs/CURRENT_STATE.md](docs/CURRENT_STATE.md). The documentation index is [docs/README.md](docs/README.md).

## Rule 1: cite everything

All work must name its sources. This applies to research, code, data, numbers, text and images, with no exceptions.

- **Facts and numbers.** Every constant, threshold, coordinate, formula or claim that comes from outside the team is written with its source next to it: a comment in the code where it is used, and a link in the document that states it.
- **Research.** When you look something up, record what you found and where: the address, the title, the owner, and the date you read it. Notes go in `research/`, and the source is added to [docs/reference/references.md](docs/reference/references.md).
- **Data.** Every dataset or file is listed in [docs/data/sources.md](docs/data/sources.md) with its owner, address, file names and required credit line.
- **Code and assets from elsewhere.** A copied component, snippet, texture or image keeps a comment naming where it came from and its licence, and is listed in the references.
- **Libraries.** Every dependency is listed in the software table of [docs/reference/references.md](docs/reference/references.md).
- **No source, no fact.** If you cannot point to a source, say so. Mark it "to confirm" in the documents and do not present it as established. Never invent a citation, an address or a value.
- **AI output is not a source.** Something a model said must be checked against a real source before it is used, and the real source is what gets cited.
- When you report on work you did, list the sources you used.

## Rule 2: the documentation is updated with every change

Documentation and code change together, in the same pull request.

- If your change makes any document wrong, fix that document before you say the work is done.
- If you build, remove or postpone something, update [docs/CURRENT_STATE.md](docs/CURRENT_STATE.md) and the status in [docs/features/README.md](docs/features/README.md).
- If you change the design, add or update a record in [docs/decisions/](docs/decisions/README.md).
- If you change the API, regenerate the contract and update [docs/backend/api-reference.md](docs/backend/api-reference.md).
- If you confirm something marked "to confirm", replace the note with the confirmed value and its source.
- Update the "Last updated" line of each document you touch.
- A task is finished only when the code, the tests and the documents all agree.

## Other rules

- **Conventions are fixed:** degrees, azimuth clockwise from north, east-positive longitude, UTC. See [docs/science/conventions-and-ephemeris.md](docs/science/conventions-and-ephemeris.md).
- **Contract first:** change the API models, regenerate `packages/contracts`, then change the web app. Never hand-edit generated types.
- **Layers go one way.** Web: page, feature view, hook, API client. API: router, service, engine. See [docs/architecture/application-layers.md](docs/architecture/application-layers.md).
- **The API owns the science.** The web app displays what the API returns and never decides visibility itself. The assistant never states a number that did not come from a tool call.
- **Tests come with the code.** Anything that changes Sun or Earth angles must still agree with JPL Horizons. See [docs/developer/testing.md](docs/developer/testing.md).
- **No secrets** in the repository. No material from an employer, a client or any other private project.
- **Large data files stay out of git.** They are downloaded by script.
- **Every screen** has a loading, an empty and an error state, and respects reduced motion.
- **Commits carry no tool attribution lines.** Record AI use in [docs/reference/ai-use.md](docs/reference/ai-use.md) instead, accurately.
- **AI-made images and video** carry a visible watermark and are listed in that file.
- Do not start work the team has not agreed, and do not widen a task. Ask when the request is unclear.

## Writing style for documents

Plain, complete sentences. Simple words. No sales language and no claims about how good the project is. State what is true now; git holds the history.

## Checks before saying a change is done

These are the planned commands. Update this block when the tooling is in place.

```bash
pnpm --filter web lint && pnpm --filter web typecheck && pnpm --filter web test
cd apps/api && uv run ruff check . && uv run pytest
pnpm contracts:check
```

Then confirm: sources cited, documents updated.
