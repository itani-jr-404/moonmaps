# 3D scenes

Status: Partly built. Last updated: 2026-11-14.

The web app's 3D scenes use three.js 0.187 directly, not React Three Fiber ([ADR-010](../decisions/ADR-010-threejs-directly.md)). The web app is being written, so this page describes the structure and the rules, not every detail.

## Structure

- Each scene is a plain TypeScript module in its feature's `lib/` folder. It creates its renderer, camera, objects and render loop, exposes a few functions to update it, and disposes of everything when asked.
- A React component in the feature mounts the scene into a canvas element in an effect and disposes of it on unmount. Scenes run only in the browser.
- Shared pieces are in `src/scene/`: renderer setup and disposal (`renderer.ts`), Moon and Earth materials with custom shaders (`body-material.ts`), model loading with three.js's GLTF loader and Meshopt decoder (`models.ts`), textures (`textures.ts`), text sprites, decorative ground (`ground.ts`, `relief.ts`), and units and direction helpers (`units.ts`).

## Scenes today

| Scene | Feature | What it shows | Data from the API |
| --- | --- | --- | --- |
| Hero stage | `hero` | The Moon, the Earth's limb, a Sun glow, stars and the NASA Z2 astronaut, behind the opening text | None. It is decoration; the live readout next to it comes from `GET /sky` at the south pole |
| Globe | `landing` | The whole Moon with curated site pins and an aiming marker, for choosing a landing point | `GET /sites` for the pins; `GET /sky` for the verdict at the aimed point. The globe's light is fixed, not the real Sun |
| Surface view | `landing` | Standing at the chosen point: the Sun, the Earth and the NASA lunar module | Sun and Earth directions and visible flags from `GET /sky` |
| Diorama | `planner` | A cut-out of ground around the place, the lander, a compass ring and beams toward the Sun and the Earth | Directions and visible flags from `GET /sky` |

The ground in the surface view and the diorama is procedural noise for decoration. It is not LOLA terrain and it never decides visibility; the API's horizon, built from LOLA grids, does ([science/terrain-and-horizon.md](../science/terrain-and-horizon.md)).

## Conventions

- three.js is Y up. In the surface scenes 1 unit is 1 km, with `+x` east, `+y` up and `-z` north (`src/scene/units.ts`).
- Direction to a body from its azimuth `A` and elevation `E`:

  ```text
  x =  cos(E) sin(A)
  y =  sin(E)
  z = -cos(E) cos(A)
  ```

- The scenes never compute where the Sun or the Earth is. They draw what `/sky` returned ([ADR-011](../decisions/ADR-011-sky-endpoint.md)).

## Rules

- One light stands for the Sun where the API says it is. On the Moon there is no air to scatter light, so ambient fill is kept low.
- Geometry, materials, textures and renderers are disposed when a scene unmounts.
- With reduced motion turned on, camera moves become cuts and nothing animates on its own.
- If WebGL is unavailable, the section still shows its text and numbers.

## Planned, not built

- A site view on real terrain from `GET /terrain`, with shadows from the tile and distant blocking from the horizon profile ([ADR-006](../decisions/ADR-006-3d-shadows-and-distant-terrain.md)).
- A Solar System scene with planet positions from `GET /scene`.
- Lighting the globe from the real sub-solar point in `GET /scene`.
- A horizon panorama (2D SVG): azimuth 0 to 360 across, elevation up, the terrain profile as a silhouette, and the Sun's and the Earth's paths drawn solid where visible and faint where hidden.
