# ADR-006: 3D shadows come from the tile; distant terrain comes from the profile

Status: Accepted. Date: 2026-11-14.

## Context

The 3D site view shows about 40 km of terrain. At the pole, a mountain 100 km away can hide the Sun. That mountain is not in the mesh, so a shadow map alone would show sunlight when the calculation says dark.

## Decision

The scene combines two things. Terrain inside the tile casts shadows through the renderer. Everything farther away is applied from the horizon profile: when the API says the Sun is hidden the light is off, and it dims as the clearance approaches zero.

## Consequences

- The picture never contradicts the numbers.
- The tile can stay small enough to load quickly.
- The transition at sunset is a dimming of the whole scene, not a shadow edge sweeping in from a distant mountain.
- At very low Sun angles the shadow map may need replacing with a shadow computed in the terrain's shader.

## Alternatives considered

- **A much larger mesh.** Correct shadows from far terrain, but hundreds of kilometres at useful resolution is too heavy for a browser.
- **No shadows, only the on and off light.** Simple, but loses the most persuasive part of the picture.
