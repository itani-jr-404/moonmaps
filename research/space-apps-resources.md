# Space Apps, challenge and mission pages for the assistant's knowledge base

Last updated: 2026-11-15.

Notes from reading the pages behind three knowledge files of the assistant: `apps/api/app/data/knowledge/challenge.md`, `space-apps.md` and `missions.md`. All pages were read on 2026-11-15 unless a line says otherwise. Each source is also in [docs/reference/references.md](../docs/reference/references.md).

## How the pages were read

- The web fetch tool failed on every spaceappschallenge.org page with a certificate error, so the pages were downloaded with `curl` instead.
- The Space Apps site builds its pages in the browser. The downloaded HTML has almost no visible text, but it carries the page data inside the Next.js payload. The challenge text, the Resources tab and the Beirut event fields were read from that payload.
- The Resources index lists its guides only in the browser. The guide titles and their one-line summaries were read from the site's public GraphQL address, https://api.spaceappschallenge.org/graphql , with a `pageByPath` query for each guide's path. The list of guides itself came back empty from that address, so the five guides are the ones the team already had from the 2026-11-14 copy in [space-apps-guides/](space-apps-guides/KEY-FACTS.md). All five pages answered on 2026-11-15.
- Facts quoted from the guides (dates, team size, judging criteria, certificate) were checked against the live HTML of each page on 2026-11-15 by searching for the exact words.
- Most of the Beirut page is images. Four were opened: `01_Hero_Beirut_2026`, `06_Event_Information`, `07_Registration_Is_Open` and `08_Announcements` at https://assets.spaceappschallenge.org/media/images/ (file names end in `.width-1024.png`).
- NASA, CSA, ISRO and LROC pages were downloaded with `curl` and read as text.

## What each page gave

| Page | Owner | What we took from it |
| --- | --- | --- |
| https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/ (and `?tab=resources`) | NASA Space Apps | Same text as the team's 2026-11-14 copy in [challenges/11-lunar-landing-site-navigator.md](challenges/11-lunar-landing-site-navigator.md). The page was last published 2026-11-13. Four resources: Quickmap, Moon Trek, Horizons System, CSA Moon Exploration. No other resources were added |
| https://www.spaceappschallenge.org/resources/ | NASA Space Apps | The note "Resources and Participant Guides will be updated periodically"; the funding line in the footer (NASA Science Mission Directorate, through a contract with Booz Allen Hamilton, Mindgrub and SecondMuse); the link to Space Apps Connect, https://github.com/nasa/spaceapps |
| The five guides under https://www.spaceappschallenge.org/resources/ | NASA Space Apps | Titles and summaries. Last published: FAQs 2026-11-13, Connect 2026-11-13, Submission 2026-11-13, Judging 2026-11-13, Team Formation 2026-09-23 |
| https://www.spaceappschallenge.org/2026/ | NASA Space Apps | Dates, team size of no more than six, submission opening and closing times |
| https://www.spaceappschallenge.org/2026/space-agency-partners/ | NASA Space Apps | 17 Space Agency Partners, including the CSA |
| https://www.spaceappschallenge.org/2026/local-events/beirut/ | NASA Space Apps; content by the Local Lead | Format In-Person; venue name and address; Local Lead Antoine Tannous; contact email; Facebook, Instagram and LinkedIn links; the note about sending the link after registration; empty schedule. The data fields for start date, end date and submission deadline are empty. The dates "14–15 November 2026" are in the page images. The images still show venue, theme and format as "To be announced", which is older than the venue field. Last published 2026-11-06 |
| https://quickmap.lroc.asu.edu/ | LROC team, Arizona State University | Redirects to https://quickmap.lroc.im-ldi.com/ . Its page description says it was developed by Applied Coherent Technology and customised for the LROC team at ASU. The map itself needs a browser and was not used |
| https://trek.nasa.gov/moon/ | NASA | Page description only; the portal needs a browser |
| https://ssd.jpl.nasa.gov/horizons/ | NASA JPL | Provided by the Solar System Dynamics Group |
| https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/ , `artemis-missions.asp`, `canada-role.asp` | Canadian Space Agency | Artemis I on November 16, 2022; Artemis II launched April 1, 2026 with CSA astronaut Jeremy Hansen; Canadarm3 for Gateway and two astronaut flights in return. The CSA says it is updating its site after NASA's Artemis changes of March 2026. The first request was reset by the server; the second worked |
| https://www.nasa.gov/humans-in-space/artemis/ | NASA | Artemis II in April 2026; Artemis III in 2027 is now a low Earth orbit test; Artemis IV in 2028 is the first crewed landing; Moon Base near the south pole |
| https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/ | NASA | The nine Artemis III candidate regions of 28 October 2024 and the selection factors |
| https://www.nasa.gov/commercial-lunar-payload-services/ | NASA | 17 deliveries awarded to five vendors, more than 60 payloads |
| https://www.nasa.gov/news-release/nasa-receives-some-data-before-intuitive-machines-ends-lunar-mission/ | NASA | IM-2 was a CLPS delivery; touchdown March 6, 2025, more than 400 m from Mons Mouton, on its side in a crater; closest landing to the south pole at that date |
| https://science.nasa.gov/mission/lro/ | NASA | Launch June 18, 2009; longest-lived lunar orbiter; LOLA is one of seven instruments |
| https://science.nasa.gov/mission/lcross/ | NASA | Launch June 18, 2009; Centaur impact in Cabeus on October 9, 2009 at 11:31 UT; findings on water ice |
| https://www.isro.gov.in/Chandrayaan3_Details.html , https://www.isro.gov.in/Chandrayaan3.html | ISRO | Objectives, mission life of one lunar day, prime landing site 69.367621 S, 32.348126 E; soft landing announced August 23, 2023 |
| https://lroc.im-ldi.com/images/1314 , https://lroc.im-ldi.com/images/1408 | LROC, ASU / NASA GSFC | Chandrayaan-3 at 69.3741 S, 32.32 E, about 600 km from the pole; IM-2 at 84.7906 S, 29.1957 E |

## What could not be read

- The list of 14 challenges at https://www.spaceappschallenge.org/2026/challenges/ loads only in a browser. The count comes from the team's 2026-11-14 copy.
- The full list of guides on the Resources index, as above.
- The Quickmap and Moon Trek applications themselves, which need a browser.
- The Beirut page's content in images other than the four opened.
- The WhatsApp link on the Beirut page was seen but is left out, as in [beirut-event.md](beirut-event.md).

## Points to confirm or to note

- NASA now plans Artemis III as a low Earth orbit test and Artemis IV as the first landing. The 2024 candidate regions were named for Artemis III. Whether they carry over to Artemis IV is to confirm.
- Two of the app's sites with kind `artemis-candidate`, the Shackleton–de Gerlache connecting ridge and Amundsen Rim, are not among NASA's nine regions of October 2024. This is noted here and not changed.
- The Beirut page gives the area as Rmeil. The organisers' slides, in [docs/hackathon/local-schedule-and-deliverables.md](../docs/hackathon/local-schedule-and-deliverables.md), say Achrafieh. Both are kept as written.
- ISRO's prime landing site and LROC's measured position of Chandrayaan-3 differ slightly. The app uses LROC's position.

## Text that looked like instructions to an AI

None was found in the pages read.
