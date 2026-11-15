# ADR-016: The landed view draws the API's terrain horizon as its skyline

Status: Accepted. Date: 2026-11-15.

## Context

In the landed view on `/explore`, the ground is procedural noise (`src/scene/ground.ts`), not LOLA terrain. To keep the drawing from contradicting the answer, a Sun or Earth that the API called visible was drawn on top of the ground with depth testing off. The drawn hills are often higher than the real horizon, so the team's testers saw the Sun and the Earth drawn in front of hills, or sunk into the ground, and read it as a wrong answer.

The API already computes the real horizon for any point: `horizon.elevation_deg` of `POST /analyze`, one elevation per degree of azimuth from the NASA LOLA grids ([ADR-004](ADR-004-horizon-profile.md), [ADR-015](ADR-015-global-terrain-grid.md)).

## Decision

After landing, the web app asks `POST /analyze` for the point's horizon and draws it (`src/features/landing/lib/skyline.ts`):

- A ring of hills whose crest, 60 km away, is at the API's horizon elevation in every direction.
- The decorative near ground is lowered wherever it would rise above that horizon, keeping 0.2 degrees below it.
- The Sun and the Earth are then drawn with normal depth testing, behind the skyline like any distant object. A body the API calls visible has its disc centre above the crest ([ADR-005](ADR-005-visibility-by-disc-centre.md)); a body the API calls hidden is still not drawn.

Until the horizon arrives, or if it cannot be loaded, the view keeps the earlier rule: a visible body is drawn over the ground.

## Consequences

- The skyline in the landed view is the same horizon the API used for the answer, so where the Sun or the Earth meets the hills matches the yes and no.
- A body just above the horizon shows only the part of its disc above the crest, as it would on the Moon.
- The near ground keeps its decorative texture but is flatter where the real horizon is low.
- One more `POST /analyze` call per landing. The API caches horizons by point.
- The planner diorama is unchanged: it draws the bodies as direction beams, not on a skyline.

## Alternatives considered

- **Draw LOLA terrain as the ground.** Correct, but needs a terrain mesh from `GET /terrain` at a resolution the global grid does not have near most sites, and more work than the deadline allows.
- **Keep drawing visible bodies on top.** Rejected: testers read the overlap as a wrong answer.
