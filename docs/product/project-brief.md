# Project brief

Status: Design. Last updated: 2026-11-14.

A one-page answer to five questions about Moon Maps: its features, what it is for, what makes it different, its one unique feature, and what it is in concrete terms. Use it for the presentation, the videos and the project page.

Everything here describes the design. What is actually built is in [CURRENT_STATE.md](../CURRENT_STATE.md).

**In one sentence:** Moon Maps lets you pick a landing site on the Moon and a date, and shows when that site has sunlight and when it can see the Earth, in 3D, on real NASA terrain.

## 1. Features

Fourteen features, in three groups. The full specification of each, with its status, is in [features/README.md](../features/README.md).

### The core: pick a site and a date, read the answer

| Feature | What it does |
| --- | --- |
| Site list and custom coordinates | Choose from past and planned landing sites (Apollo, Artemis candidate regions, CLPS targets, other countries' missions), or enter any latitude and longitude |
| Date range and time slider | Choose a range, then move through it hour by hour, or press play |
| Horizon panorama | The outline of the terrain all around the site, with the paths of the Sun and the Earth drawn over it |
| Timeline | Bars showing when the Sun is up, when the Earth is up, and when both are |
| Power and communication numbers | Share of time in sunlight, share of time with the Earth in view, time left until sunset and until Earthset, longest dark period, longest gap in communication, height of the Sun |
| Comparison | Up to four combinations of site and date side by side, each marked go, caution or no-go for power and for communication. One button shifts a scenario by a month to show what a delay would do |
| Accuracy page | Our Sun and Earth angles next to NASA JPL Horizons' values for the same place and time |

### The picture: see it in 3D

| Feature | What it does |
| --- | --- |
| Moon globe | A realistic Moon with pins on the sites. Click a pin, or click anywhere to choose your own point |
| Site view | The terrain around the site in 3D, lit only by the Sun, with shadows that move as time passes |
| Solar System view | The Sun and the eight planets where they are on the chosen date, then a flight in to the Earth and the Moon |
| Landing page | A short animated intro that explains why the south pole is hard, with a button into the app |

### The guidance: understand it

| Feature | What it does |
| --- | --- |
| Assistant | A chat that explains a number on screen, answers questions about the Moon, and can run a comparison when asked |
| Planner and Explorer modes | Planner shows every number. Explorer shows fewer numbers, explains each one, and offers ready-made scenarios |
| Data export | Download the current result as CSV or JSON, with its sources |

## 2. What it is for

Moon Maps answers one question: **if we land here, on this date, will we have power and will we be able to talk to Earth?**

A lander near the Moon's south pole needs the Sun for power and warmth, and needs the Earth above the horizon to talk to mission control without a relay satellite. Both sit low in the sky there, and the ground is rough, so a ridge tens of kilometres away can hide either one for days. A small move, or a short delay, can change the answer.

It is for two kinds of people.

- **Mission planners and engineers.** When a launch slips or hardware is late, they need to check quickly whether the site still works on the new date, or find another site nearby. Moon Maps lets them compare options in one place.
- **Teachers, students and curious visitors.** It shows, in a way that can be seen and played with, why landing at the south pole is so difficult.

The need comes from the challenge itself: the existing tools "are built for detailed analysis and are often difficult for non-specialists to use effectively for rapid scenario comparison" (challenge statement, see Sources).

## 3. What makes us different

Each point is something concrete in the design, set against the three tools the challenge names: Quickmap, Moon Trek and JPL Horizons.

1. **One screen instead of three tools.** Today the terrain is in one tool and the positions of the Sun and the Earth are in another, and a person joins them by hand. Moon Maps does the joining: the site, the date, the sky, the terrain and the numbers are together.
2. **Terrain is part of the answer, for any date.** JPL Horizons treats the Moon as a smooth ball, so its sunrise and sunset ignore mountains. NASA's illumination maps include terrain but are averages over many years. Moon Maps applies the real terrain to a specific date and time.
3. **You see it, you do not read it.** The 3D scene has one light, the Sun, placed where it really is at that moment. The shadows on screen are the shadows a lander would get. The Moon has no air, so they are sharp and black.
4. **The picture and the numbers cannot disagree.** One calculation feeds the panorama, the timeline, the metrics, the 3D lighting and the assistant.
5. **Built for comparing, and for a slipped schedule.** Up to four scenarios side by side, a one-month shift in one click, and a link that reproduces the whole comparison for someone else.
6. **It can be checked.** An accuracy page inside the app shows our angles against JPL Horizons, and says plainly what the app does not model.
7. **An assistant that calculates instead of guessing.** It explains terms from a small set of documents we wrote, and when it gives a number, that number came from our own calculation.

## 4. The unique feature

**For any place on the Moon and any date, Moon Maps shows the real shadow of the real terrain falling across the landing site, and the numbers beside it come from the same calculation.**

Put simply: you choose a site and a day, press play, and watch the Sun slide along the horizon until a distant ridge hides it. At that same moment the timeline bar ends, the countdown reaches zero and the 3D scene goes dark.

Why this is the feature to lead with:

- It is the gap the challenge describes, closed in one view: position data and terrain data joined, for a chosen date.
- It works for both audiences. A planner reads the time of sunset. A student sees why it happens.
- It rests on one idea, the horizon profile: how high the terrain rises in every direction from the site. That profile is computed once from NASA elevation data and is used by everything else.

A caution, so that we do not overstate it: we have compared ourselves only with the three tools the challenge names. More than a thousand teams chose this challenge, and some will build something similar. Say "what sets our approach apart", not "nobody else does this".

## 5. What the project is, specifically

| | |
| --- | --- |
| Name | Moon Maps |
| Team | Lunar Titans: Ali Al Itani, Leonardo Khayyat, Hussein Alassaad, Sam Abou Zeid, Khalil Dandashli, Hassan Korek |
| Event | NASA Space Apps Challenge 2026, Beirut local event, 14 to 15 November 2026 |
| Challenge | Lunar Landing Site Navigator |
| Kind of product | A web app. It runs in a browser, with no login and nothing to install |
| Web app | Next.js, React, TypeScript, Tailwind CSS, three.js through React Three Fiber |
| Calculations | Python, FastAPI, Skyfield, numpy |
| NASA data | JPL ephemerides (positions), JPL Horizons (the reference we test against), LOLA elevation from the Lunar Reconnaissance Orbiter (terrain), PGDA illumination maps (a second check), CGI Moon Kit and Blue Marble (surfaces) |
| Partner data | Canadian Space Agency, Moon Exploration portal (background for site descriptions and the assistant) |
| AI in the product | Only the assistant. Every position, horizon and metric is an ordinary calculation from NASA data |
| Licence | Apache 2.0 |

### How it gets its answer

1. From NASA JPL ephemeris files, it calculates where the Sun and the Earth are in the sky of the site at each moment.
2. From NASA LOLA elevation data, it works out how high the terrain rises in every direction from the site. This is the horizon profile.
3. It compares the two. The Sun or the Earth is visible when it is higher than the terrain in its direction. The Moon has no atmosphere, so light is not bent.
4. From that it finds the windows of sunlight and of Earth visibility, and the summary numbers.

### What goes in and what comes out

| In | Out |
| --- | --- |
| One to four scenarios. A scenario is a site (from the list, or any latitude and longitude) and a date range | For each: the horizon around the site, the Sun's and the Earth's position at every step, when each is visible, the windows, the metrics, and a go, caution or no-go status for power and for communication |

### Its limits

- Dates from about 1900 to 2050, which is what the ephemeris file covers.
- Detailed terrain near the south pole; a coarser map elsewhere on the Moon.
- It does not model the radio link itself, temperatures, or light reflected into shadow.
- The go, caution and no-go badges are summaries with adjustable thresholds, not mission criteria.

## Sources

- The need, the audiences and the named existing tools: the challenge statement, https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/ , read 2026-11-14, kept in [research/challenges/11-lunar-landing-site-navigator.md](../../research/challenges/11-lunar-landing-site-navigator.md).
- That JPL Horizons uses a smooth Moon with no terrain, and that the illumination maps are long-term averages: [data/sources.md](../data/sources.md), from the Horizons response header and the PGDA product page, read 2026-11-14.
- The number of teams on this challenge (1,058 on 2026-11-14): the challenge page's Teams tab, same file as above.
- The features and the method: the design documents in this folder, starting at [README.md](../README.md).
- The data sources and their credit lines: [data/sources.md](../data/sources.md) and [reference/references.md](../reference/references.md).

The points in sections 3 and 4 are the team's own assessment of its design. They are comparisons with the three tools named by the challenge, and have not been checked against every other lunar tool.
