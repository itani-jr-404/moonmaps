# Landing page

Status: Partly built. Last updated: 2026-11-16.

The home page is `/`. It introduces the problem and links to the other pages: the globe (`/explore`), the planner (`/planner`), the sites (`/sites`), the accuracy page (`/accuracy`) and about (`/about`). The route list and the code folders are in [routes-and-state.md](routes-and-state.md). The web app is being written, so this page states the rules rather than every detail.

## Sections of the home page

| Section | What happens |
| --- | --- |
| Hero | A preloader, then the Moon, the Earth's limb and the NASA Z2 astronaut behind the title. A live line gives the Sun and the Earth at the south pole now, from `GET /sky`. "Plan a landing" opens `/planner`; "Choose a landing" opens `/explore`. |
| What you can do | One card for each page: Choose a landing, Plan a landing, Browse the sites, How sure are we, About. |
| Coming next | A preview of the planned ideas from the About page's Future scope: two looping illustrations and the emergency landing simulation, all with made-up data and labelled so, and a "See the Future scope" button to `/about#future-h`. On medium screens the two illustrations stack beside the simulation; on wide screens the three sit in a row. |
| Why | Why missions want the south pole, and why light and a line of sight to the Earth decide a landing. It comes after the cards and the preview, so the tools come first. Each card's drawing has light grey Moon ground with a few craters, drawn by the team in SVG. |

The preloader plays only when a visit starts on `/`.

## The globe page (`/explore`)

A globe of the Moon with the curated sites. Aiming at a point asks the API whether the Sun and the Earth are visible there; choosing it opens a surface view of that point. When the landed spot is not good now, the panel says "Good again from (date), for (length)", from one `POST /analyze` over the next 30 days, or that it is not good at any time in those 30 days. "See everything about this spot" opens the site page: `/sites/(id)` when the site's pin was clicked, else `/sites/spot?lat=&lon=` for the point itself (a nearby site is only named, "near (site)"). "See the best dates" opens `/planner` on the spot.

Data credits, the statement that NASA does not endorse the project, and the team's names (team Lunar Titans: Ali Al Itani, Hussein Alassaad, Leonardo Khayyat, Khalil Dandashli, Hassan Korek) are in the footer of every page.

The hero scene is decoration; it does not show where the Sun or the Earth really is. Every number on the pages comes from the API.

## Motion

- Smooth scrolling with Lenis; scroll-linked animation with GSAP. The wheel is tuned to answer quickly (`src/lib/motion/smooth-scroll.tsx`): one wheel step moves the page 1.4 times its distance, and the page settles in about 0.2 s (measured in Chrome on 2026-11-16: a 100-pixel step moved the page 140 pixels, 90 % of it within 0.2 s).
- Every animation explains something or guides the eye. Nothing loops forever in the visitor's peripheral vision, with one exception: the two Future scope illustrations loop inside their own small box, and each has a Pause button (WCAG 2.2 success criterion 2.2.2, https://www.w3.org/TR/WCAG22/#pause-stop-hide).
- Interface motion is short (150 to 400 ms); a scene change can take up to about 1.2 s.
- Nothing blocks input. The visitor can scroll or click during any animation.
- With reduced motion set, smooth scrolling is off, and animations must give way to still content with the same text and buttons.

## Performance

- The title and buttons render as plain HTML before the 3D is ready.
- Textures are web sizes: the Moon colour map is 2048 x 1024. The Z2 model is compressed to 0.80 MB ([data/sources.md](../data/sources.md)).
- Fonts are loaded with `next/font`.

## Writing

Each section has short body text in plain words. The page states what the app does; it does not make claims about how good it is.
