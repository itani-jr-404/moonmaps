# Lunar Titans: our challenge, our decisions, our rules

App name: **Moon Maps**.

Team: Lunar Titans, 6 members, NASA Space Apps Challenge 2026, Beirut local event (in person at SGUB, Nov 14 to 15, 2026).
Facts below were checked on 2026-11-14 against the files in this folder; each names its source. Team decisions come from the earlier handoff (kept outside the repository).

## Deadline

**Click "Submit for Judging" before Sunday, Nov 15, 11:59 p.m. Beirut time.** Submission opened Sat, Nov 14, 9:00 a.m. Anything saved after the deadline is not judged. Only the last saved submission counts. (`../research/space-apps-guides/submission-guide.md`)

## Our challenge: Lunar Landing Site Navigator

Full page: [`../research/challenges/11-lunar-landing-site-navigator.md`](../research/challenges/11-lunar-landing-site-navigator.md). Official URL: https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/

- Difficulty: Advanced, Intermediate. Subjects: Human Exploration, Moon, Software, Space Exploration.
- 1,058 teams worldwide picked this challenge. 8 of them are in Beirut, so these are our local rivals for Global Nominee: ASTRASTEK, As-Troy\Ed, BELLATRIX, BlissFall, HΞXASTELLAR, LunAscend, Moonshot.exe, and us. (`../research/beirut-event.md`)
- The brief: an intuitive tool for mission planners, educators and the public to compare Moon south pole landing sites and dates quickly, showing Sun and Earth positions relative to the horizon, to judge power generation and direct-to-Earth communication windows.

What the page suggests (all optional):

1. Curated site list (Apollo, CLPS targets, other commercial and national missions) plus custom coordinates; side-by-side comparison.
2. Date and time selection; how conditions change across lunar days and seasons.
3. Sun and Earth positions relative to the horizon; time left before sunset and Earthset.
4. Metrics: solar elevation angle, sunlight duration, Earth visibility windows.
5. 2D maps, 3D surface views or other creative visuals.
6. Animations or timelines over a lunar day or several days.
7. Works for both experts and the public.

Technical hints on the page: ephemerides from JPL Horizons or pre-computed datasets; LOLA topography for realistic horizons; no atmosphere, so no refraction (the horizon is terrain plus the edge of the lunar sphere); show solar elevation prominently; consider Earth libration and orbital variation; represent steep slopes and deep craters.

### Resources tab (all of it)

The tab has only four links. It does not link LOLA or the PGDA illumination maps; those are our own picks, now checked with exact files and URLs in [`../research/data-source-notes.md`](../research/data-source-notes.md).

| Resource | Owner | Use for us |
| --- | --- | --- |
| [Quickmap](https://quickmap.lroc.asu.edu/) | ASU, LRO data | Visual check of terrain and sites |
| [Moon Trek](https://trek.nasa.gov/moon/) | NASA | 3D terrain, visual check of horizons |
| [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) | NASA JPL | Sun and Earth positions from any lunar site; our validation source |
| [CSA Moon Exploration](https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/) | Canadian Space Agency | Background only; counts as partner data if used |

## Team decisions (settled, do not reopen)

- Challenge: Lunar Landing Site Navigator. Backups only for an emergency: Field Shift, then Flame in Freefall.
- Live on-demand computation for any coordinates and dates. A few precomputed sites serve as cache and demo fallback.
- Stack: Next.js with TypeScript (frontend), Python with FastAPI (backend: Skyfield or SPICE geometry, terrain, horizon, metrics). OpenAPI schema generates the TypeScript types.
- Working plan (Sam's): agree contract together, then frontend and backend in parallel (frontend on mocks), then integrate, then validate, test and deploy.
- No product owner role. No separate data-layer or routing role.
- Everyone writes at least one test for their own code. Calculations are checked against JPL Horizons, by someone other than the author where possible.
- Feature list agreed in hour 1, frozen around hour 30.

Ali's roles: technical lead (architecture, API contract and data format in hour 0 to 1, unblocking, deployment) and the power and communication metrics logic.

## Submission checklist, tied to the official rules

Project page fields, all required (`../research/space-apps-guides/submission-guide.md`):

- [ ] Project name
- [ ] High-level summary: what we built, how it answers the challenge, why it matters
- [ ] Demo link (public)
- [ ] Final project link (public repo or deployed site)
- [ ] Detailed description: what it does, how it works, benefits, tools and languages
- [ ] Use of Super Intelligence (AI): how we used Claude and other tools
- [ ] NASA data used: JPL Horizons, LOLA terrain, PGDA illumination maps (whichever we actually use). **At least one NASA source is required for a Global Award.**
- [ ] Partner data and references: every dataset, library, code snippet and image, open source included
- [ ] Tick Terms and Conditions and "Confirm All Work is Original"

Demo (mandatory; breaking a limit removes us from Global Judging):

- [ ] Either a video of **30 seconds or less**, or **7 slides at most** (title slide counts)
- [ ] English, or English subtitles
- [ ] Hosted outside the site (YouTube, Drive, GitHub), public, no login; test in a private window
- [ ] Suggested video order: team and names (0:00), challenge and why (0:02), title and tagline (0:05), how it works with visuals and NASA data (0:10), future impact (0:20 to 0:30)

AI and content rules (`../research/space-apps-guides/submission-guide.md`, `../research/space-apps-guides/terms-and-conditions.md`):

- [ ] AI-made images and video carry a **visible watermark**. This covers the team image, the logos and Ali's photoreal group image if any are used.
- [ ] AI-made code, data and audio are disclosed in the description **and in metadata** (the rule says "descriptive text and metadata"): a README section on AI use, plus a header comment in AI-assisted files.
- [ ] No NASA logos, flags or mission insignia in AI-made content.
- [ ] No images or likeness of anyone under 18; no personal data.
- [ ] Repo has an open-source license (default if none: Apache 2.0).

Team eligibility (`../research/space-apps-guides/judging-guide.md`):

- [ ] All 6 registered for the Beirut event, confirmed (not waitlisted), and on the team's Members tab before submission closes.

Recommended:

- [ ] Request a FortiGuard rating for the deployed URL so judges' networks do not block it: https://www.fortiguard.com/faq/wfratingsubmit (company name "N/A").
- [ ] Ask the local lead (team@spaceappslebanon.org, or the WhatsApp group (link kept in the team chat, not in this repository)) for the local schedule and local judging time; none is posted. (`../research/beirut-event.md`)
- [ ] Ask data questions on Space Apps Connect, https://github.com/nasa/spaceapps, where NASA experts answer. It closes when the hackathon ends.

## How we are judged

Five criteria, each 1 to 5, no weights (`../research/space-apps-guides/judging-guide.md`):

| Criterion | For us |
| --- | --- |
| Impact | Faster site and date decisions for planners; teaches the public why the south pole is hard |
| Creativity | A presentation no existing tool has; Quickmap, Moon Trek and Horizons are the baseline |
| Validity | Our numbers match JPL Horizons for at least two sites; the tool works live |
| Relevance | NASA data drives every number shown |
| Presentation | The 30 second demo plus the project page |

Path: Beirut judges pick Global Nominees (announced Dec 3, 2026), expert judges pick Global Finalists and Honorable Mentions (Dec 17), NASA and partner executives pick 10 Global Award winners (Jan 26, 2027). Awards that fit us best: Best Use of Data, Best Use of Technology, Best Mission Concept. (`../research/space-apps-guides/judging-guide.md`, `../research/space-apps-guides/awards.md`)

## Corrections to the handoff

| Handoff says | Actually true | Source |
| --- | --- | --- |
| Criteria include "Influence" | The criterion is **Impact** | `../research/space-apps-guides/judging-guide.md` |
| Path includes "Universal Event nominees" | The Universal Event is a separate virtual event. Beirut teams go local judging, Global Nominees, Global Finalists, 10 Global Winners | `../research/space-apps-guides/judging-guide.md` |
| Resources tab not read yet (V2, step 1) | Read: only Quickmap, Moon Trek, Horizons and CSA. No LOLA or PGDA links | challenge page, Resources tab |
| Submission requirements unverified (step 6) | Verified; see the checklist above | `../research/space-apps-guides/submission-guide.md` |

New rules the handoff did not cover: the AI watermark on images and video, the AI disclosure field, the 30 second or 7 slide demo limit, and the default Apache 2.0 license.

The submission guide also says AI "should not be used to come up with your idea of how to solve the challenge." The SI field is not shown to judges, but answer it honestly.

## Open next steps

1. Confirm who is backend and who is frontend, and where Ali's two roles sit in Sam's plan.
2. Give the 6th member the light role: curated list of south pole landing sites with coordinates and short descriptions.
3. Hour 0 to 1: feature list agreed together, OpenAPI contract and shared data format written by Ali.
4. Pick the horizon data path. Suggested in [`../research/data-source-notes.md`](../research/data-source-notes.md): LOLA LDEM_80S_80M (111 MB) for horizon profiles. Minimum Validity story, in two parts: (a) our Sun and Earth azimuth and elevation match JPL Horizons for at least two sites (Horizons has no terrain, so it checks geometry only); (b) our terrain-aware long-run sunlight fraction is close to the PGDA average illumination map for those sites.
5. Book the last 4 hours before the deadline for the demo video, the project page and the checklist above.
