# Landing page

Status: Partly built. Last updated: 2026-11-15.

The home page is `/`. It introduces the problem and links to the other pages: the globe (`/explore`), the planner (`/planner`), the sites (`/sites`), the accuracy page (`/accuracy`) and about (`/about`). The route list and the code folders are in [routes-and-state.md](routes-and-state.md). The web app is being written, so this page states the rules rather than every detail.

## Sections of the home page

| Section | What happens |
| --- | --- |
| Hero | A preloader, then the Moon, the Earth's limb and the NASA Z2 astronaut behind the title. A live line gives the Sun and the Earth at the south pole now, from `GET /sky`. "Plan a landing" opens `/planner`; "Choose a landing" opens `/explore`. |
| Why | Why missions want the south pole, and why light and a line of sight to the Earth decide a landing. |
| What you can do | One card for each page: Choose a landing, Plan a landing, Browse the sites, How sure are we, About. |

The preloader plays only when a visit starts on `/`.

## The globe page (`/explore`)

A globe of the Moon with the curated sites. Aiming at a point asks the API whether the Sun and the Earth are visible there; choosing it opens a surface view of that point. When the landed spot is not good now, the panel says "Good again from (date), for (length)", from one `POST /analyze` over the next 30 days, or that it is not good at any time in those 30 days. "See everything about this spot" opens the site page: `/sites/(id)` when the site's pin was clicked, else `/sites/spot?lat=&lon=` for the point itself (a nearby site is only named, "near (site)"). "See the best dates" opens `/planner` on the spot.

Data credits and the statement that NASA does not endorse the project are in the footer of every page.

The hero scene is decoration; it does not show where the Sun or the Earth really is. Every number on the pages comes from the API.

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
