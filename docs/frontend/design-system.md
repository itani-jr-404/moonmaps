# Design system

Status: Partly built. Last updated: 2026-11-15.

The interface is dark navy with a still star field, with the 3D scenes behind the text. How styling is organised is decided in [ADR-012](../decisions/ADR-012-visual-styling.md). The web app is being written, so the values change; the file is the source, not this page.

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

Colour values today:

| Token | Value | Used for |
| --- | --- | --- |
| `--color-bg` | `#0c1630` | The page. The page background is a gradient from `#0c1630` to `#101d3d` (`--page-grad`) |
| `--color-bg-2` | `#172a55` | Card surfaces (planner calendar, best windows, accuracy tiles) |
| `--color-bg-3` | `#1e3262` | Raised parts inside a card (bar tracks, the toast) |
| `--color-panel` | `#1b2f5d` | Top of the card gradient `--card-grad` (`--color-panel` to `--color-bg-2`), used by `.panel` and the why, about and planner step cards |
| `--color-nav` | `#1a2c58` | The navigation bar, always lighter than the page, with a `--color-line-2` border under it |
| `--color-ink` | `#e8eef8` | Main text |
| `--color-muted` | `#c3cee2` | Body text in cards |
| `--color-faint` | `#a2b0cb` | Small labels |
| `--color-line`, `--color-line-2` | `rgb(156 194 255 / 0.22)`, `rgb(156 194 255 / 0.4)` | Lines; cards use `--color-line-2` for a visible border |
| `--color-accent`, `--color-accent-2` | `#78a5f0`, `#9cc2ff` | Links, labels, focus |

Background: `body::before` in `globals.css` draws the gradient and a fixed star field of small CSS radial-gradient dots. The team wrote it; it uses no image. It does not move, so reduced motion needs no change. Sections leave their background transparent so the stars show through.

Contrast (WCAG 2.2 success criterion 1.4.3, at least 4.5 to 1 for normal text, https://www.w3.org/TR/WCAG22/#contrast-minimum), worked out with the WCAG relative luminance formula on 2026-11-15:

| Text | On `--color-bg` | On `#101d3d` | On `--color-bg-2` | On `--color-panel` | On `--color-bg-3` |
| --- | --- | --- | --- | --- | --- |
| `--color-ink` | 15.4 | 14.2 | 12.0 | 11.2 | 10.7 |
| `--color-muted` | 11.3 | 10.5 | 8.8 | 8.2 | 7.9 |
| `--color-faint` | 8.2 | 7.6 | 6.4 | 6.0 | 5.7 |
| `--color-accent` | 7.2 | 6.7 | 5.6 | 5.2 | 5.0 |
| `--color-warn` | 6.7 | 6.2 | 5.2 | 4.9 | 4.6 |

Rules:

- The Sun is always `--color-sun` and the Earth always `--color-earth`, in the 3D scenes, the calendar, the verdict and the legends. A viewer learns the code once.
- Status is never colour alone; it always carries a word.
- Text on any surface meets a contrast ratio of at least 4.5 to 1. The table above was worked out by hand; it is not checked by a test yet.
- Cards are lighter than the page and have a visible border, so they stand out on every page.

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
