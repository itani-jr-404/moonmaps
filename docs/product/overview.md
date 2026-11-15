# Product overview

Status: Design. Last updated: 2026-11-15.

## The problem

A spacecraft that lands near the Moon's south pole needs two things from the sky.

- **The Sun**, for solar power and to keep its equipment from freezing.
- **The Earth**, so it can talk to mission control directly, without a relay satellite.

At the south pole both sit close to the horizon. The ground there is rough, with high ridges and deep craters, so a mountain tens of kilometres away can hide the Sun or the Earth for days. Moving the landing point a short distance, or landing a few days later, can change the answer completely.

This matters most when plans change. Missions in NASA's Commercial Lunar Payload Services (CLPS) programme, like many others, sometimes have to move their landing date because of hardware or launch delays. Each time, the team has to check whether the site still works on the new date, or find another one nearby.

The data to do this exists. Quickmap and Moon Trek show the terrain, and JPL Horizons gives the positions of the Sun and the Earth. But they are separate tools built for specialists, and they return maps and tables of numbers. Combining them for one site and one date takes time; comparing several options takes much longer.

Source: the challenge statement, kept in [research/challenges/11-lunar-landing-site-navigator.md](../../research/challenges/11-lunar-landing-site-navigator.md).

## What Moon Maps is

One place to pick a site and a date and see the answer. In everyday terms it is a map and a forecast for Moon landings: the map says where, the forecast says when there is light and when there is a signal.

- The site, the date, the sky, the terrain and the numbers are on one screen.
- The scene is in 3D and lit only by the Sun, placed where it really is at that moment, so the shadows are the shadows a lander would get.
- Up to four combinations of site and date can be put side by side.
- A chat assistant explains what is on screen in plain words.

## Who it is for

| User | What they need | What the app gives them |
| --- | --- | --- |
| Mission planners and engineers | Numbers, and a fast way to compare options when a date slips | Metrics, countdowns to sunset and Earthset, side by side comparison, a one-month shift, an accuracy page, data export |
| Educators, students, curious visitors | To understand why the south pole is so hard | A guided intro, a realistic 3D scene, explanations of terms, an assistant |

The same screens serve both. A switch between a Planner mode (all the numbers) and an Explorer mode (fewer numbers, more explanation) is planned; see [features/README.md](../features/README.md).

## The six screens

| # | Screen | What happens there |
| --- | --- | --- |
| 1 | Landing page | A short animated intro that explains the problem, with a button into the app |
| 2 | Solar System | The Sun and the eight planets where they are on the chosen date, then a flight in to the Earth and the Moon |
| 3 | Moon globe | A realistic Moon with pins on known landing sites; click a pin or any point |
| 4 | Site view | The terrain around the site in 3D with moving shadows, a panorama of the horizon with the Sun's and the Earth's paths, a time slider |
| 5 | Compare | Up to four scenarios side by side, each marked go, caution or no-go for power and for communication |
| 6 | Assistant | A chat that explains a number, answers questions about the Moon, or runs a comparison |

This table is the design. The deployed app (https://moonmaps.vercel.app) has these pages: home, choose a landing (the Moon globe and a landed view), the planner, sites with a page per site (a horizon panorama, a sky forecast and an elevation map), accuracy and about, with the assistant on every page. The Solar System screen and the Compare screen are not built. See [CURRENT_STATE.md](../CURRENT_STATE.md).

Detailed specifications: [frontend/](../frontend/routes-and-state.md) and [features/README.md](../features/README.md).

## What it does not do

- It does not model the radio link itself, thermal conditions, or light reflected into shadowed areas.
- Its go, caution and no-go badges are summaries with adjustable thresholds, not mission criteria.
- It does not store anything about its users.

## How the challenge's requests are covered

See [challenge-coverage.md](challenge-coverage.md).
