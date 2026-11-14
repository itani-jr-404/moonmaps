# ADR-010: three.js used directly, not React Three Fiber

Status: Accepted. Date: 2026-11-14.

## Context

The team's web prototype, built outside this repository, draws its 3D scenes (the hero Moon, the globe used to choose a landing site, the surface view and the planner's diorama) with three.js in imperative code: each scene creates its renderer, camera, meshes and render loop in plain TypeScript, and several materials use custom shaders. React Three Fiber with drei was the other option for the web app's 3D. Porting the prototype into `apps/web` meant either keeping its scene code or rewriting every scene as React components.

## Decision

The web app uses three.js 0.187 directly. Each scene is a plain module in its feature's `lib/` folder (for example `src/features/landing/lib/globe-scene.ts`), with shared pieces in `src/scene/` (renderer setup, materials, model and texture loading, units). A React component mounts the scene into a canvas element, passes it data, and disposes of it on unmount. React Three Fiber and drei are not used.

## Consequences

- The prototype's scenes and shaders moved over with few changes, so the 3D work kept its tested look.
- React does not re-render on each frame; scenes read the current time and data through their own update functions.
- Each scene must dispose of its geometry, materials, textures and renderer itself. Nothing does it automatically.
- Scenes are not declarative, so a new contributor must read the scene module rather than a JSX tree.
- One less layer of dependencies to keep in step with React 19 and three.js versions.

## Alternatives considered

- **React Three Fiber with drei.** Declarative scenes and helpers for loading and controls. Not chosen because every prototype scene and shader would have to be rewritten during the hackathon, with no change for the user.
- **Mixing both.** Rejected: two ways to build a scene in one app is harder to maintain than one.
