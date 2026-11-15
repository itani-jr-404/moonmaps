# Moon Maps: potential impact and business opportunity

Team Lunar Titans: Ali Al Itani, Hussein Alassaad, Leonardo Khayyat, Khalil Dandashli, Hassan Korek. NASA Space Apps Challenge 2026, Beirut, challenge "Lunar Landing Site Navigator". Last updated: 2026-11-15.

Live app: https://moonmaps.vercel.app · Code: https://github.com/itani-jr-404/moonmaps

This document answers the "business opportunity or potential impact" item of the NASA Space Apps Beirut 2026 Slack requirements.

## 1. The problem

A lander near the Moon's south pole needs two things from the sky: the Sun, for power and warmth, and the Earth, to talk to mission control without a relay satellite. At the pole both sit low, and the ground is rough, so a ridge far away can hide either one for days. A small change of place or date can change the answer.

Missions often have to change their landing date because of hardware or launch delays. Each time, the team must check again whether the site still has sunlight and an Earth link, or find another site nearby. The data exists, but it is spread across tools such as Quickmap, Moon Trek and JPL Horizons, which the challenge describes as "built for detailed analysis and ... often difficult for non-specialists to use effectively for rapid scenario comparison" (challenge statement, https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/).

## 2. What Moon Maps changes

- One question, one answer: for any point on the Moon and any time from 1900 to 2050, is the Sun above the real terrain, and is the Earth?
- Seconds instead of hours: a new date or a nearby site gives a new verdict at once, with a 30-day calendar of good landing windows.
- Real terrain: horizons come from NASA's Lunar Orbiter Laser Altimeter (LOLA) maps, at 80 m and 120 m per pixel near the south pole and from a global map elsewhere.
- Checked against NASA: Sun and Earth positions agree with NASA JPL Horizons within 0.0001 degrees, and long-term results match NASA Goddard's polar maps with correlations of 0.992 for sunlight and 0.999 for Earth visibility. See [VALIDATION.md](../VALIDATION.md).
- Plain words: a chat assistant explains results using only numbers from the Moon Maps API.

## 3. Who benefits

| Who | What they get |
| --- | --- |
| Commercial lander teams, such as those in NASA's Commercial Lunar Payload Services programme (https://www.nasa.gov/commercial-lunar-payload-services/) | A fast first check of a site and date after a schedule change, before detailed analysis |
| Space agencies and university teams planning south pole missions, for example around the Artemis III candidate regions (https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/) | A shared view of when each candidate site has power and an Earth link |
| Teachers, students and the public | A 3D Moon where they can land anywhere and see why the south pole is hard: the Sun skims the horizon and hills hide it |

## 4. Potential impact

- **Faster decisions.** Teams can rule sites and dates in or out quickly and spend detailed analysis only on the promising ones.
- **Shared understanding.** Science and engineering teams look at one picture and one set of numbers, which come from the same calculation.
- **Education.** The app turns ephemeris and terrain data into something anyone can see and try, in any browser, with no login.
- **Reuse.** The public API (https://moonmaps-api.vercel.app/docs) returns the same results as JSON, so other tools and classes can build on it.
- **Open.** The code is open source under the Apache License 2.0, and every number and dataset is cited in [CITATIONS.md](../../CITATIONS.md).

## 5. Business opportunity

These are the team's proposals, not tested plans.

- **Free public tool.** The app stays free for education and outreach. It runs without accounts or a database, which keeps it cheap to host.
- **Planning features for mission teams.** Features from our future scope could serve professional users: watching a site during the flight against new orbital images and hazard data, and finding the best spot and date in an area with a coarse-to-fine quadtree search and a sliding window over time.
- **API for other tools.** Mission planning software, simulators and teaching platforms could call the Moon Maps API instead of building their own terrain and ephemeris pipeline.
- **Partnerships.** Universities, planetariums and space agencies could use Moon Maps in teaching and public events.

## 6. Limits to keep in mind

Moon Maps is a planning and learning tool, not flight software. It does not model the radio link itself or temperatures. Outside the south polar region the terrain map is about 1.9 km per pixel, so small nearby hills are smoothed. Side-by-side comparison of scenarios is in the API but not yet in the web app. The full list is in [approach-challenges-and-limits.md](approach-challenges-and-limits.md).
