# Design system

Status: Partly built. Last updated: 2026-11-14.

The interface is dark, with the 3D scenes behind the text. How styling is organised is decided in [ADR-012](../decisions/ADR-012-visual-styling.md). The web app is being written, so the values change; the file is the source, not this page.

## Tokens

All design tokens are CSS variables in the `@theme` block of `apps/web/src/app/globals.css`, which makes them Tailwind CSS v4 utilities (for example `--color-sun` gives `text-sun`, `bg-sun`). Components use the tokens, never raw values.

| Group | Tokens today |
| --- | --- |
| Backgrounds and panels | `--color-bg`, `--color-bg-2`, `--color-bg-3`, `--color-panel` |
| Text | `--color-ink`, `--color-muted`, `--color-faint` |
| Lines | `--color-line`, `--color-line-2` |
| Accent | `--color-accent`, `--color-accent-2`, `--color-on-accent` |
| Bodies | `--color-sun`, `--color-earth` |
| Status | `--color-ok`, `--color-warn` |
| Fonts | `--font-display`, `--font-body`, `--font-mono` |

Rules:

- The Sun is always `--color-sun` and the Earth always `--color-earth`, in the 3D scenes, the calendar, the verdict and the legends. A viewer learns the code once.
- Status is never colour alone; it always carries a word.
- Text on any surface meets a contrast ratio of at least 4.5 to 1. This is not checked by a test yet.

## Type

Three families, loaded with `next/font/google` in `src/app/layout.tsx`: Exo 2 (display), Jost (body) and JetBrains Mono (numbers and labels). Their licences are to confirm and to list in [reference/references.md](../reference/references.md). Numbers use the monospaced face so values do not jump as they change. Units are always shown with the number (`1.5°`, `70 h`, `82 %`).

## Effects

Effects that are hard to write as utility classes (the custom cursor, the navigation bar, the footer, section layouts) are CSS modules next to their component, for example `src/features/site-chrome/components/custom-cursor.module.css`. Scroll-linked motion uses GSAP; smooth scrolling uses Lenis. With reduced motion set, smooth scrolling is off.

## Components

Small shared components are in `src/components/ui`: icons, loading, empty and error states (`states.tsx`), and a toast. Feature-specific components stay in their feature folder. shadcn/ui, Chart.js and React Bits are not used.

## Icons and images

- One icon set throughout (`src/components/ui/icons.tsx`).
- Any image or video made with an AI tool carries a visible watermark, and is listed in [reference/ai-use.md](../reference/ai-use.md).
- NASA logos, insignia and mission patches are not used.
