# ADR-001: The calculations run in a Python backend

Status: Accepted. Date: 2026-11-14.

## Context

The hard part of the app is the science: where the Sun and the Earth are, seen from a point on the Moon, in the Moon's own rotating frame. The web app is in TypeScript, and a single language would be simpler to run.

## Decision

The API and all calculations are written in Python, with FastAPI and Skyfield. The web app stays in TypeScript.

## Consequences

- Skyfield places an observer on the Moon with a few lines and reads the JPL files directly, so we do not write orbital mechanics ourselves.
- Our numbers can be checked against JPL Horizons, which strengthens the validity of the result.
- numpy makes the horizon walk a single array operation.
- We run two languages and need a contract between them (ADR-003).
- The API needs a host that runs containers, separate from the web app's host.

## Alternatives considered

- **TypeScript backend.** One language, but no equally established library for an observer on the Moon's surface. We would implement and validate the frames ourselves.
- **Calling JPL Horizons for everything.** No astronomy code at all, but Horizons is a shared service with rate limits, each call takes seconds, and it has no terrain.
- **Doing the calculation in the browser.** No server, but the elevation grid is over 100 MB and the kernels are not practical to ship to a browser.
