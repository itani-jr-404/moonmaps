# ADR-005: A body is visible when its centre is above the terrain

Status: Accepted. Date: 2026-11-14.

## Context

The Sun and the Earth are discs. As one sets behind a ridge it is partly visible for a while. We need one rule for "visible".

## Decision

A body counts as visible when the centre of its disc is above the terrain horizon. The API also returns the clearance in degrees, so the interface can show "partly hidden" near the edge.

## Consequences

- One simple rule, the same for both bodies, easy to test.
- For the Sun this means at least half the disc is showing.
- For the Earth it is cautious: a radio link wants a clear line. Our Earth percentages will be somewhat lower than NASA's maps, which count any part of the disc.
- The difference is stated on the accuracy page.

## Alternatives considered

- **Any part of the disc.** Matches NASA's Earth visibility maps, but is optimistic for a radio link.
- **The whole disc.** Most cautious, but understates sunlight for power.
- **Fraction of the disc.** More faithful for power, but a continuous value complicates windows and metrics. It can be added later from the clearance without changing the contract.
