# ADR-008: No login and no database; the URL holds the scenario

Status: Accepted. Date: 2026-11-14.

## Context

The project and its demo must be reachable by anyone without signing in. The app has no data that belongs to a user.

## Decision

There are no accounts and no database. The curated sites are a file. Results are computed on request. A scenario is encoded in the page's address, so sharing a link shares the result.

## Consequences

- Nothing personal is stored, so there is nothing to protect or to delete.
- The API can run as a single stateless container.
- A result can be reproduced by anyone from its link.
- There is no "save my comparison" feature; the link is the save.
- Public endpoints need rate limits, most of all the assistant.

## Alternatives considered

- **Accounts with saved projects.** Useful for a real planning team, but it adds a login in front of a public demo and a store to operate.
