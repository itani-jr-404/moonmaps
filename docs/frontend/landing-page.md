# Landing page

Status: Design. Last updated: 2026-11-14.

The landing page at `/` introduces the problem in under a minute of scrolling and sends the visitor into the app. It should feel like the opening of a short film, and it must not get in the way: the button to the app is reachable at any time.

## Sections, in order

| # | Section | What happens |
| --- | --- | --- |
| 0 | Loader | A thin ring while the Moon texture and fonts load. It never lasts longer than the load itself. |
| 1 | Hero | The Moon rises from the bottom of the screen. The title comes in one line at a time. A short line of text says what the app does. Two buttons: open the app, scroll to learn more. |
| 2 | The south pole | The camera turns to look down at the pole. One sentence on why missions want to land there (water ice). |
| 3 | Light is rare | The Sun circles the horizon; long shadows sweep the surface. One sentence. |
| 4 | The Earth hides | The Earth appears low over the ridge line, then slips behind it. One sentence about the radio link. |
| 5 | Choose well | Two site markers a short distance apart, one lit and one dark. One sentence: a small move or a few days change everything. |
| 6 | Key figures | Three or four numbers that count up (for example the length of a lunar day, the Sun's highest elevation at the pole). Every number shown is one we can cite. |
| 7 | What you can do | Three or four cards: pick a site, move through time, compare, ask the assistant. |
| 8 | Final call | The button to the app, data credits, and a link to the About page. |

Sections 2 to 5 are pinned: the Moon stays on screen and the scene changes as the visitor scrolls.

## Motion

- **Scroll:** smooth scrolling with Lenis; scroll-linked animation with GSAP ScrollTrigger. Each pinned section drives a timeline by scroll position, so scrolling back plays it in reverse.
- **Text:** headlines reveal line by line; body text fades up. Text effects come from React Bits components where one fits (Split Text, Blur Text).
- **Numbers:** the Count Up component, started when the section enters the view.
- **Buttons:** a magnetic hover on the main button (Magnet), and a soft border light on cards (Spotlight Card or Star Border).
- **Background:** a starfield behind everything, moving slightly with the scroll.

Rules:

- Every animation explains something or guides the eye. Nothing loops forever in the visitor's peripheral vision.
- Durations are short: 150 to 400 ms for interface motion, up to about 1.2 s for a scene change.
- Nothing blocks input. The visitor can scroll or click during any animation.

## The 3D Moon

One sphere with the NASA color map at reduced size, lit by a single light. The scroll position sets the camera and the light direction. The scene is rendered on demand and paused when the hero is off screen.

## Reduced motion and weak devices

If the visitor has reduced motion turned on, or 3D cannot start:

- pinned sections become ordinary sections with a still image each;
- text appears without animation;
- the counters show their final values.

The content and the buttons are the same in both versions.

## Performance

| Item | Target |
| --- | --- |
| First view usable | Before the 3D is ready; the title and buttons render as plain HTML first |
| 3D code | Loaded after the first paint, in its own chunk |
| Moon texture on this page | 2048 px, WebP or JPEG |
| Fonts | Two families at most, preloaded |

## Writing

Each section has one sentence of body text, in plain words. The page states what the app does; it does not make claims about how good it is.
