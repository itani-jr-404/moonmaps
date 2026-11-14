# Conventions

Status: Design. Last updated: 2026-11-14.

Rules we agree to follow so that code written by six people reads as one codebase. Layering rules are in [architecture/application-layers.md](../architecture/application-layers.md); units are in [science/conventions-and-ephemeris.md](../science/conventions-and-ephemeris.md).

## General

- Small pull requests, one purpose each.
- Code and documents change together. If your change makes a document wrong, fix it in the same pull request.
- No secrets in the repository, in code, in tests or in screenshots.
- No dead code, commented-out blocks or leftover debug output.
- Comments say why, not what. They describe the code as it is now, not its history.

## Names

| Thing | Rule | Example |
| --- | --- | --- |
| API fields | snake_case, with the unit in the name when it is not degrees | `sun_el`, `longest_dark_hours`, `spacing_m` |
| TypeScript variables and functions | camelCase | `currentTime`, `sampleAt` |
| React components and their files | PascalCase | `StatTile.tsx` |
| Other TypeScript files | kebab-case | `scenario-store.ts` |
| Python | snake_case; classes in PascalCase | `sun_earth_altaz`, `AppError` |
| Site ids | Lower case with hyphens, never changed | `malapert-massif` |

Angles in code are in degrees unless the name ends in `_rad`.

## TypeScript and React

- Strict TypeScript. No `any`; use `unknown` and narrow.
- Types for API data come from `packages/contracts`. Do not redeclare them.
- A component does one thing. If it fetches, it does so through a hook from `lib/api`.
- Server components by default; `'use client'` only where there is state, an effect or three.js.
- Styling uses Tailwind classes and the design tokens. No raw colour or spacing values in components.
- Every data view handles loading, error and empty.
- Nothing is computed twice: derived values are functions of the store and the query data.

## Python

- Type hints on every function.
- Engines are pure: arguments in, values out, no file or network access except the grid passed in.
- Work on arrays, not loops, for anything per sample or per azimuth.
- Raise `AppError` for anything the caller can cause. Let unexpected errors reach the handler.
- Constants that come from a source carry a comment naming the source.

## Formatting and linting

| Side | Tools | Style |
| --- | --- | --- |
| Web | ESLint, Prettier | Single quotes, semicolons, trailing commas, 80 columns, Tailwind class sorting |
| API | ruff (lint and format) | ruff defaults, 100 columns |

A pre-commit hook formats and lints staged files. CI rejects unformatted code.

## Git

- Branch from `main`: `feat/<short-name>`, `fix/<short-name>`, `docs/<short-name>`.
- Commit messages: `type(scope): summary` in the imperative, for example `feat(api): add horizon profile cache`.
- Commits carry no tool attribution lines.
- A pull request states what changed, how it was tested, and which documents were updated.
- At least one other person looks at a pull request before it is merged. For engine code, that person re-checks the calculation.
- `main` is always deployable.

## Tests

See [testing.md](testing.md). In short: everyone writes at least one test for their own code, and anything that changes angles must still agree with JPL Horizons.

## Dependencies

- Add a dependency only when it removes real work, and note it in the pull request.
- It must be free to use, and its licence must be compatible with an open-source release.
- Everything we use is listed in [reference/references.md](../reference/references.md).

## Third-party code and assets

- Components copied from a library (for example React Bits) keep a comment naming the source and are listed in the references.
- Images and textures are listed with their owner and credit line in [data/sources.md](../data/sources.md).
- Anything produced with an AI tool is recorded in [reference/ai-use.md](../reference/ai-use.md).
