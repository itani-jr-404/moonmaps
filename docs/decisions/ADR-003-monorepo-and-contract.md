# ADR-003: One repository with a generated contract

Status: Accepted. Date: 2026-11-14.

## Context

The frontend and the backend are built at the same time by different people, in different languages. The usual failure is that the two drift apart and nobody notices until integration.

## Decision

Both live in one repository. The backend's Pydantic models are the contract. An OpenAPI file is exported from them, and the TypeScript types are generated from that file. CI fails if the committed contract is out of date.

## Consequences

- A change to a response shape shows up as a type error in the web app.
- The frontend can work from mock files that are typed with the generated types.
- Changing the contract is a three step routine: change the model, export, generate.
- One pull request can change both sides together.

## Alternatives considered

- **Two repositories.** Clearer ownership, but versions of the contract must be published and matched.
- **Types written by hand on both sides.** No tooling, but nothing detects drift.
