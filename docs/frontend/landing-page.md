# Landing page

Status: Partly built. Last updated: 2026-11-14.

The app is one page at `/`. Its opening sections introduce the problem and lead to the planner, which is where a visitor gets an answer. The section list and the code folders are in [routes-and-state.md](routes-and-state.md). The web app is being written, so this page states the rules rather than every detail.

## Sections

| Section | What happens |
| --- | --- |
| Hero | A preloader, then the Moon, the Earth's limb and the NASA Z2 astronaut behind the title. A live line gives the Sun and the Earth at the south pole now, from `GET /sky`. |
| Choose a landing | A globe of the Moon with the curated sites. Aiming at a point asks the API whether the Sun and the Earth are visible there; choosing it opens a surface view of that point. |
| Why | Why missions want the south pole, and why light and a line of sight to the Earth decide a landing. |
| Planner | Pick a site and a moment. A verdict, a 30-day calendar, the best windows and a 3D diorama. |
| About | What the app does and how. Data credits and the statement that NASA does not endorse the project are in the footer. |

The hero scene is decoration; it does not show where the Sun or the Earth really is. Every number on the page comes from the API.

## Motion

- Smooth scrolling with Lenis; scroll-linked animation with GSAP.
- Every animation explains something or guides the eye. Nothing loops forever in the visitor's peripheral vision.
- Interface motion is short (150 to 400 ms); a scene change can take up to about 1.2 s.
- Nothing blocks input. The visitor can scroll or click during any animation.
- With reduced motion set, smooth scrolling is off, and animations must give way to still content with the same text and buttons.

## Performance

- The title and buttons render as plain HTML before the 3D is ready.
- Textures are web sizes: the Moon colour map is 2048 x 1024. The Z2 model is compressed to 0.80 MB ([data/sources.md](../data/sources.md)).
- Fonts are loaded with `next/font`.

## Writing

Each section has short body text in plain words. The page states what the app does; it does not make claims about how good it is.
