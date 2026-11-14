# ADR-012: Visual styling with Tailwind tokens and CSS modules; no shadcn/ui yet

Status: Accepted. Date: 2026-11-14.

## Context

The project's stack summary listed Tailwind CSS with shadcn/ui components and Chart.js for charts as options. The team's prototype has its own look: a small set of colours, three type families, and a few effects (a custom cursor, the navigation bar, the footer) that are hard to express as utility classes. The app is one page with a few controls; it has no forms or dialogs that need a component library yet.

## Decision

Design tokens (colours, fonts and similar) are CSS variables in the `@theme` block of `apps/web/src/app/globals.css`, used through Tailwind CSS v4 utilities. Complex effects are written as CSS modules next to their component (for example `custom-cursor.module.css`). Small shared components live in `src/components/ui`. shadcn/ui is not used for now, and the calendar and other displays are built by hand rather than with Chart.js.

## Consequences

- The prototype's look carries over exactly.
- No generated component code to keep up to date.
- Accessible behaviour (focus, keyboard, labels) is our job for every control. If the app gains dialogs, menus or complex form controls, adding shadcn/ui (built on Radix) should be reconsidered.
- Colours must come from the tokens, never raw values, so the Sun and Earth colours stay the same everywhere.

## Alternatives considered

- **shadcn/ui from the start.** Accessible primitives, but its default look would have to be undone to match the prototype, for a page that has few such controls.
- **Only Tailwind utilities.** Hard to read for the layered effects; CSS modules keep them in one place.
- **CSS-in-JS.** Adds a runtime and a dependency for no gain over CSS modules in Next.js.
