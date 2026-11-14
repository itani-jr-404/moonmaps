# ADR-004: The horizon is a 360-value profile built from LOLA grids

Status: Accepted. Date: 2026-11-14.

## Context

To know whether the Sun or the Earth is hidden, we need to know how high the terrain rises in every direction from the site. This could be recomputed for every time step, or summarised once.

## Decision

For each site we compute one horizon profile: the highest elevation angle of the terrain for each whole degree of azimuth, looking out to 200 km, from the 80 m per pixel LOLA polar grid. Visibility at any time is then a comparison with this profile.

## Consequences

- The slow work is done once per site, and every time step afterwards is a lookup.
- The same profile draws the panorama, so the picture and the numbers share one source.
- Gaps between peaks narrower than a degree are smoothed.
- Sites outside the polar grids use a much coarser global map, and the response says which was used.

## Alternatives considered

- **Ray casting per time step.** Exact for each moment, but hundreds of times more terrain lookups for the same answer.
- **The finest grids (5 m).** More detail close to the site, but they cover only a few kilometres, and horizons at the pole are set by distant mountains.
- **Using NASA's illumination maps directly.** They are long-term averages and cannot answer a question about a date.
