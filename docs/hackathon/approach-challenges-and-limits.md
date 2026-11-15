# Moon Maps: data, method, development process, challenges and next steps

Team Lunar Titans: Ali Al Itani, Hussein Alassaad, Leonardo Khayyat, Khalil Dandashli, Hassan Korek. NASA Space Apps Challenge 2026, Beirut, challenge "Lunar Landing Site Navigator". Last updated: 2026-11-15.

Live app: https://moonmaps.vercel.app · Code: https://github.com/itani-jr-404/moonmaps

This document covers the points the NASA Space Apps Beirut 2026 Slack requirements ask the judging video to explain: the data, software, methods and tools used; what makes the solution distinctive; the development process, with its challenges and limitation; and why the team chose this approach.

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

- **Real terrain for the exact moment.** JPL Horizons treats the Moon as a smooth ball, and NASA's illumination maps are long-term averages. Moon Maps applies LOLA terrain to the exact site and minute you choose, which is the question a mission team actually has.
- **You stand on the site.** The landed view puts you on the chosen spot and shows the Sun and the Earth rising and setting over the real skyline, so the answer can be seen, not only read.
- **A forecast, not a snapshot.** Each site has a 14-day sky forecast, a 30-day calendar of good windows, and the time to leave Earth to land in the next one, based on the travel times of real missions.
- **Proven against NASA, in the open.** An accuracy page compares our results with JPL Horizons, the Apollo moonwalks and NASA Goddard's maps, and anyone can repeat the checks. See [VALIDATION.md](../VALIDATION.md).
- **An assistant that never guesses.** Every number it gives comes from a call to the Moon Maps API, and it lists its sources.

## 5. Development process

- **Day 1, 14 November 2026.** The team chose the challenge, wrote the idea description and the design documents, set up the repository with automated checks, built the API and the first web app, and wrote the first validation report and browser tests. The judges gave feedback in the evening.
- **Day 2, 15 November 2026.** The team acted on each point of that feedback: checks against past missions, the distance to the Earth, travel times and a sky forecast. It added the chat assistant, terrain for the whole Moon, an error study and the accuracy page. A 23-case test round by the team found problems that were fixed the same afternoon.
- **How the work was done.** Tasks were tracked on a Jira board. Each change went through a GitHub pull request and was merged only when every automated check passed, and each merge deployed itself. More than 20 pull requests were merged. Every outside number names its source next to it.

## 6. Challenges we overcame

### Minimizing the error rate

A landing verdict is only useful if it can be trusted, so we treated accuracy as a feature. We measured every source of error and drove each one down:

- Sun and Earth positions now agree with NASA JPL Horizons within **0.0001 degrees** in all 16 test cases, against a pass rule of 0.05 degrees.
- Our Sun angles match JPL Horizons at all **16 Apollo moonwalk** start and end times, from 1969 to 1972.
- Over 18.6 years at 300 random south pole points, our results match NASA Goddard's polar maps with correlations of **0.992** for sunlight and **0.999** for Earth visibility.
- An error study found a 27-second time offset caused by leap seconds. We fixed it and added a test so it cannot return.
- A model trained on NASA's maps cut the error of our Earth-visibility estimate by **72 %** on points it had never seen.

### Choosing the best way to show the answer

The same result has to work for an engineer who wants numbers and for a student who wants to understand. We chose a set of views that each answer one question:

- **Is it good now?** A plain verdict for sunlight, for the Earth, and for both.
- **When is it good?** A 30-day calendar of good landing windows and a 14-day sky forecast.
- **Why?** A horizon panorama with the paths of the Sun and the Earth, and a landed view where you watch them cross the real skyline.
- **Where?** A 3D Moon you can spin and land on anywhere.

Every view reads from the same API result, so the picture, the numbers and the assistant always agree.

## 7. Limitation and next step

Moon Maps checks the direct link between the landing site and the Earth. It does not yet count relay satellites, which could keep a lander connected even when the Earth is hidden behind the terrain. Adding relay coverage is the next step we are working on.

## 8. Why we chose this approach

- **Live calculation.** Computing the answer on request works for any site and any time, not only for precomputed cases. Each site's horizon is computed once and reused, so answers stay fast.
- **Python for the science.** Skyfield and NumPy are well-tested astronomy and numeric libraries, and JPL Horizons can check their results.
- **The API owns the science.** The web app and the assistant only show what the API returns, so the 3D picture, the numbers and the chat always agree.
- **No login and no database.** Anyone can open the app at once, and a link shares the exact site and time.
- **Tests against NASA.** Comparing with JPL Horizons and NASA Goddard's maps lets judges and users see how far to trust the results.

## 9. Future scope

- **Relay satellites.** Count relay coverage alongside the direct Earth link, so a site hidden from the Earth can still be shown as connected.
- **Watching the site during the flight.** Check the target again and again against new orbital images and hazard data, such as a fresh impact crater, so the crew can change site before landing.
- **The best spot in an area.** From 4 corners and 2 dates, find the point and start date with the longest run of good days, with a coarse-to-fine quadtree search and a sliding window over time.
