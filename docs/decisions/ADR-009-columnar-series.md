# ADR-009: Time series are sent as parallel arrays

Status: Accepted. Date: 2026-11-14.

## Context

One scenario is hundreds to thousands of samples, each with eight values. A comparison is four scenarios.

## Decision

The `series` object holds one array per quantity (`t`, `sun_az`, `sun_el`, and so on). Index `i` in every array belongs to the same moment.

## Consequences

- The response is several times smaller than a list of objects, because field names are not repeated.
- Arrays go straight into charts and into typed arrays for the 3D scene.
- Code must never reorder or filter one array without the others. A helper, `sampleAt(series, i)`, is the only way views read a sample.

## Alternatives considered

- **A list of objects, one per sample.** Easier to read by eye, but much larger and slower to parse.
- **A binary format.** Smallest, but harder to inspect and debug.
