# ADR-002: Positions are calculated live; horizons are cached

Status: Accepted. Date: 2026-11-14.

## Context

The challenge asks for custom coordinates and flexible dates. A table of precomputed results for a few sites and dates would be simple and fast, but would not answer "what about here, on this date".

## Decision

The API calculates positions for any site and any time range when asked. The horizon profile, which is the slow part and depends only on the site, is computed once per site and stored on disk. Curated sites are precomputed.

## Consequences

- Any point on the Moon and any date in the kernel's range works.
- The first request for a new custom site is slower than later ones.
- We ship precomputed results for the curated sites with the web app, as a fallback if the API is unreachable.
- The cache key must include everything the profile depends on: grid, coordinates, observer height.

## Alternatives considered

- **Precompute only.** Fast and safe for a demo, but fails the "any site, any date" requirement.
- **No cache.** Simpler code, but every request repeats the same half million terrain lookups.
