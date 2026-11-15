# Moon Maps: data, method, development process, challenges and limits

Team Lunar Titans: Ali Al Itani, Hussein Alassaad, Leonardo Khayyat, Khalil Dandashli, Hassan Korek. NASA Space Apps Challenge 2026, Beirut, challenge "Lunar Landing Site Navigator". Last updated: 2026-11-15.

Live app: https://moonmaps.vercel.app · Code: https://github.com/itani-jr-404/moonmaps

This document covers the points the NASA Space Apps Beirut 2026 Slack requirements ask the judging video to explain: the data, software, methods and tools used; what makes the solution distinctive; the development process, with its challenges and limitations; and why the team chose this approach.

## 1. Data

| Data | Owner | What it does in Moon Maps |
| --- | --- | --- |
| DE421 ephemeris and lunar orientation kernels | NASA JPL (NAIF) | Positions of the Sun and the Earth in the sky of any site |
| LOLA elevation, south pole, 80 m and 120 m per pixel (`LDEM_80S_80M`, `LDEM_75S_120M`) | NASA LRO, LOLA | The terrain horizon near the south pole |
| LOLA elevation, global, 16 pixels per degree (`LDEM_16`) | NASA LRO, LOLA | The terrain horizon everywhere else |
| JPL Horizons | NASA JPL | The reference our positions are tested against |
| Polar illumination and Earth-visibility maps (PGDA product 69) | NASA Goddard | The reference our long-term results are tested against |
| CGI Moon Kit; NASA 3D Resources | NASA SVS; NASA | The Moon's surface in 3D, the lunar module and astronaut models |
| Mission launch and landing times | NASA NSSDCA, JAXA, ISRO | Travel times and when to leave Earth |

Every source, with its address and credit line, is in [CITATIONS.md](../../CITATIONS.md).

## 2. Software and tools

- **API:** Python, FastAPI, Skyfield and NumPy. It does every calculation.
- **Web app:** TypeScript, Next.js, React, three.js, Tailwind CSS and GSAP. It only displays what the API returns.
- **Contract:** the API's OpenAPI description generates the web app's types, so the two cannot drift apart.
- **Chat assistant:** free AI model providers in a chain, with the Moon Maps API as its only source of numbers.
- **Hosting and checks:** Vercel deploys both parts from `main`. GitHub Actions runs 97 API tests, 173 web tests and 20 browser tests on every change. The team planned the work on a Jira board.

## 3. Method

1. **Sky.** For a site and a time, Skyfield computes the Sun's and the Earth's azimuth and elevation from the DE421 ephemeris.
2. **Horizon.** From the LOLA grid, the API finds the highest terrain angle in each whole degree of azimuth, out to 200 km, for an observer 2 m above the ground. This horizon profile is computed once per site.
3. **Visibility.** A body is visible when the centre of its disc is above the horizon in its direction. The Moon has no atmosphere, so no refraction is added.
4. **Windows.** Repeating this over time gives the windows of sunlight, of Earth visibility, and of both together, which make a good landing site.

## 4. What makes it distinctive

- **Real terrain for a specific date.** JPL Horizons treats the Moon as smooth, and NASA's illumination maps are long-term averages. Moon Maps applies LOLA terrain to the exact moment chosen.
- **A landed view.** You stand on the chosen spot and watch the Sun and the Earth rise and set over the real skyline.
- **A forecast.** Each site has a 14-day sky forecast, a 30-day calendar of good windows, and when to leave Earth to land in the next one, based on past missions' travel times.
- **Checked in the open.** An accuracy page shows our results against JPL Horizons, the Apollo moonwalks and NASA Goddard's maps. See [VALIDATION.md](../VALIDATION.md).
- **An assistant that does not guess.** Every number it gives comes from a call to the API, and it lists its sources.

## 5. Development process

- **Day 1, 14 November 2026.** The team chose the challenge, wrote the idea description and the design documents, set up the repository with automated checks, built the API and the first web app, and wrote the first validation report and browser tests. The judges gave feedback in the evening.
- **Day 2, 15 November 2026.** The team acted on each point of that feedback: checks against past missions, the distance to the Earth, travel times and a sky forecast. It added the chat assistant, terrain for the whole Moon, an error study and the accuracy page. A 23-case test round by the team found problems that were fixed the same afternoon.
- **How the work was done.** Tasks were tracked on a Jira board. Each change went through a GitHub pull request and was merged only when every automated check passed, and each merge deployed itself. More than 20 pull requests were merged. Every outside number names its source next to it.

## 6. Challenges we met

| Challenge | What we did |
| --- | --- |
| In the landed view, the Sun and the Earth looked like they clipped into the hills | The landed view now draws the API's real LOLA horizon as its skyline, so bodies rise and set behind the actual ridges |
| Terrain covered only the south pole, so other sites had a flat horizon | We added NASA's global LOLA grid, so every site has a real terrain horizon |
| The error study found that every time was 27 s off, because leap seconds were not counted | We fixed the time conversion and added a test |
| The 1999 Apollo Journal table of Sun angles differed from ours by up to 4.3 degrees | JPL Horizons gives our values, so we report the gap as a property of the table and explain it on the accuracy page |
| Free AI models have daily limits and can be slow | The assistant chains several free providers and moves to the next when one runs out |

## 7. Limits

- Outside the south polar region the terrain map is about 1.9 km per pixel, so small nearby hills are smoothed and a horizon set by them can be too low.
- Dates run from 1900 to 2050, the range of the ephemeris and lunar orientation files.
- The horizon has a 1 degree resolution and a 200 km reach.
- Visibility uses the centre of the disc. Counting any part of the disc matches NASA's long-term maps more closely; see [VALIDATION.md](../VALIDATION.md).
- The app does not model the radio link itself, temperatures or light reflected into shadow.
- Side-by-side comparison of scenarios is in the API but not yet in the web app.
- Chat answers take about 11 to 17 seconds on the free models.
- The 3D scenes have not been tried on a real low-end phone.

## 8. Why we chose this approach

- **Live calculation.** Computing the answer on request works for any site and any time, not only for precomputed cases. Each site's horizon is computed once and reused, so answers stay fast.
- **Python for the science.** Skyfield and NumPy are well-tested astronomy and numeric libraries, and JPL Horizons can check their results.
- **The API owns the science.** The web app and the assistant only show what the API returns, so the 3D picture, the numbers and the chat always agree.
- **No login and no database.** Anyone can open the app at once, and a link shares the exact site and time.
- **Tests against NASA.** Comparing with JPL Horizons and NASA Goddard's maps lets judges and users see how far to trust the results.

## 9. Future scope

- Watching the site during the flight, against new orbital images and hazard data such as a fresh impact crater.
- Finding the best spot in an area: from 4 corners and 2 dates, the point and start date with the longest run of good days, with a coarse-to-fine quadtree search and a sliding window over time.
