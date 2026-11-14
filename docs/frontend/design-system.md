# Design system

Status: Design. Last updated: 2026-11-14.

The interface is dark, with see-through panels floating over the 3D scene. The values below are starting points; they live in `src/app/globals.css` as CSS variables and nowhere else. Components use the variables, never raw values.

## Colour

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#05070D` | Page background, space |
| `--text` | `#E8ECF4` | Main text |
| `--text-muted` | `#9AA6B8` | Secondary text, axis labels |
| `--line` | `rgba(255,255,255,0.10)` | Borders, dividers |
| `--sun` | `#FFD166` | Everything about the Sun: path, bar, marker, light |
| `--earth` | `#60A5FA` | Everything about the Earth: path, bar, marker |
| `--terrain` | `#6B7280` | Horizon silhouette |
| `--go` | `#34D399` | Go status |
| `--caution` | `#F97316` | Caution status |
| `--no-go` | `#F87171` | No-go status |
| `--focus` | `#93C5FD` | Focus ring |

Rules:

- The Sun is always the same warm yellow and the Earth always the same blue, in the 3D scene, the panorama, the timeline, the legends and the assistant's answers. A viewer learns the code once.
- Caution is orange rather than yellow so that it is not mistaken for the Sun.
- Status is never colour alone. A badge always carries the word.
- Text on any surface meets a contrast ratio of at least 4.5 to 1. A test reads the tokens and checks the pairs we rely on.

## Glass surfaces

Panels are translucent with a background blur, a thin light border and a soft shadow.

| Level | Use | Fill | Blur |
| --- | --- | --- | --- |
| 1 | Side panels, timeline bar | `rgba(255,255,255,0.06)` | 20 px |
| 2 | Cards and tiles inside a panel | `rgba(255,255,255,0.09)` | 20 px |
| 3 | Popovers, tooltips, the chat panel | `rgba(16,20,32,0.80)` | 24 px |

Text never sits directly on the bright part of the 3D scene; it is always on a surface.

## Type

| Role | Font | Notes |
| --- | --- | --- |
| Interface and body | Inter | 14 px base in the app, 16 px on the landing page |
| Numbers | A monospaced face, or Inter with tabular figures | So values do not jump as they change |
| Headlines on the landing page | Inter, heavy weight, tight tracking | Large |

Units are always shown with the number (`1.5°`, `70 h`, `82 %`).

## Space, radius, motion

- Spacing scale in steps of 4 px: 4, 8, 12, 16, 24, 32, 48.
- Radius: 8 px for controls, 14 px for panels, full for pills and badges.
- Motion: 150 ms for hover and press, 250 ms for panels opening, 400 ms for view changes; ease-out for things entering, ease-in for things leaving.
- With reduced motion turned on, transitions become instant and camera flights become cuts.

## Components

In `src/components/ui`. Built on shadcn/ui primitives where one exists.

| Component | Purpose |
| --- | --- |
| `GlassPanel` | The surface, with a level prop |
| `StatTile` | One metric: label, value, unit, optional small trend line |
| `StatusBadge` | Go, caution or no-go, with the word and a tooltip stating the rule |
| `SegmentedControl` | The view switch (Solar, Moon, Site, Compare) |
| `TimeSlider` | The scrubber with play, pause and speed |
| `TimelineBar` | A horizontal bar of windows for one body |
| `ChartFrame` | A titled frame for a chart, with built-in loading, empty and error states |
| `Skeleton` | Placeholder while loading |
| `Notice` | Inline message: information, warning, error |
| `Toast` | Short confirmations |
| `Sheet` | A panel that slides over the scene on narrow screens |

Each component has a loading and a disabled state where that makes sense, a visible focus ring, and works from the keyboard.

## Charts

- The horizon panorama and the timeline are hand-built SVG, because they need exact control. See [3d-scenes.md](3d-scenes.md).
- Other charts (elevation over time, comparison bars) use Chart.js inside a `ChartFrame`.
- Axes are labelled with units. Grid lines are faint. The Sun and Earth colours are fixed as above.

## Effects from React Bits

Used sparingly, mostly on the landing page: Split Text and Blur Text for headlines, Count Up for figures, Magnet on the main button, Spotlight Card or Star Border on cards, Glass Surface where it fits. Each one is copied into the repository so it can be restyled with our tokens, and is listed in [reference/references.md](../reference/references.md).

## Icons and images

- One icon set throughout.
- Any image or video made with an AI tool carries a visible watermark, and is listed in [reference/ai-use.md](../reference/ai-use.md).
- NASA logos, insignia and mission patches are not used.
