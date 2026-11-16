# Future scope demos: watching the site during the flight, the best spot in an area, and emergency landing mode

Last updated: 2026-11-16. Status: study done. None of the three ideas is built; the About page shows a small box for each, and Home previews the same boxes.

This note collects what the team needs to show three planned ideas from the About page's "Future scope" honestly: item 05, re-checking the landing site during the flight; item 06, finding the best spot in an area; and item 07, an emergency landing mode. Every external source was read on 2026-11-15. Anything marked "to confirm" was seen only in a search result, or has no source yet.

## 05. Watching the site during the flight

### What exists today

- **Orbital cameras that can image a landing site.** The LRO Narrow Angle Camera takes visible-light images at 0.5 m per pixel from 50 km, in strips 2.5 km wide; the Wide Angle Camera gives 75 m per pixel [S3]. The NAC has to be pointed. Targets are planned ahead from orbit predictions, side rolls are limited, and neighbouring orbits overlap above 85° latitude, so polar sites get more chances to be imaged [S4, S5]. Chandrayaan-2's OHRC reaches 0.25 m per pixel over a 3 km strip from 100 km (to confirm, from an ISRO handbook seen as a snippet) [S7]; ISRO used it to study Chandrayaan-3's main and backup sites before launch [S8]. ShadowCam on Danuri images inside permanently shadowed craters [S9].
- **The ground does change.** Comparing LROC NAC images taken before and after, Speyerer et al. found 222 new impact craters, and 33 % more craters of 10 m or larger than the standard model predicts [S1]. NASA's release on the same study gives "more than 200" craters 3 to 43 m across [S2]. An 18 m crater formed on 17 March 2013 [S10]. Rockfalls are mapped too: 136,610 of them [S12]. A fresh crater at a chosen site is rare, but possible.
- **No mission is known to re-image its site during the trip.** The research found no mission that re-imaged its landing site during the transfer to make a go or no-go call. LRO imaged IM-1 about 43.5 hours after it landed, and NASA published the image four days after landing [S6]. This step, comparing a fresh image with the last one and re-checking a backup site, is what Moon Maps would add.
- **Sensors on the lander during the descent, the last line of defence.**

| Sensor | What it measures | Signal | When it works | Source |
| --- | --- | --- | --- | --- |
| Terrain-relative navigation camera (NASA SPLICE) | Position, by matching live photos to orbital maps | Visible light | Before and during powered descent | S13, S14 |
| Navigation Doppler lidar (NASA) | Speed and altitude along 3 laser beams, 20 times a second | Laser light | From about 10 km in SPLICE; flew on IM-1 | S13, S16 |
| Hazard detection lidar (NASA SPLICE) | A 3D map of slopes and rocks | Laser light | At about 500 m; picks the safest spot within about 100 m | S13 |
| Chandrayaan-3 sensors | Hazard camera, position camera, Ka-band radar altimeter, laser altimeter, laser Doppler velocimeter | Visible light, radio (Ka-band), laser light | Hover at 150 m while the hazard camera picks a spot | S18, S29 |
| JAXA SLIM | Position by image matching; altitude and speed by landing radar; obstacles by camera | Visible light, radio | Obstacle check at about 50 m; landed within 10 m | S19 |

A terrain-relative navigation fix is only as good as its reference map, and NASA notes that lunar science maps are not yet validated for navigation [S22]. This is a reason to keep the orbital map current during the flight.

- **Communication.** LRO sends its science data on K-band radio at 26 GHz [S24]. NASA expects one-way delays of 3 to 14 seconds in lunar operations [S23].
- **Landing requirements.** NASA's 2025 Space Apps talk lists, for the crewed lander: within 6° of the south pole, slope under 10° over 100 m, Earth in view for direct radio, the surface lit, and landing within 100 m of the target [S25]. Since 2026, NASA's Artemis III page describes Artemis III as a 2027 test in low Earth orbit, with the first landing on Artemis IV [S20]. Whether the same requirements carry over is to confirm.
- **Pacing.** Apollo 11: trans-lunar injection at about 2 h 44 min, lunar orbit at 75 h 50 min, descent orbit at 101 h 36 min, powered descent at 102 h 33 min, landing at 102 h 45 min [S27]. Chandrayaan-3's descent: rough braking from 30 km to 7.4 km, fine braking to 800 m, hover, down to 150 m, hover while the hazard camera picks a spot, move across, touchdown [S29].

### What the illustration shows

A small looping box under card 05 on the About page (`apps/web/src/features/future-scope/components/future-demos.tsx`): a new LRO image (visible light) sweeps over the site, a fresh crater appears inside the landing circle as the sweep crosses it, and the target moves to a backup site that still has the Sun and the Earth in view. The caption names the camera's visible light and 0.5 m per pixel [S3] and the K-band radio that carries the image to Earth [S24]. The crater, the sites and the map are made up, and the box says so. The loop has a Pause button, and with reduced motion the box shows the finished picture.

## 06. The best spot in an area

### The method

- The team's name for it is "coarse-to-fine quadtree plus sliding window" (Khalil Dandashli, `#lunar-titans`, 15 November 2026). The region quadtree splits an area into four equal quarters again and again; Samet describes searching a coarse level first and then the finer levels where something of interest was found [Q2]. Finkel and Bentley's 1974 paper is the point quadtree, a storage structure, so it is not the right source for this search [Q1].
- **Keeping only the best quarter is not safe.** DIRECT, the closest well-studied method, divides every "potentially optimal" box rather than only the best one, and always keeps one of the largest boxes, so in the limit it searches everything [Q3, Q4]. The demo therefore keeps the best few cells at each level, and also keeps a cell whose samples disagree strongly. No source gives an upper bound on the longest run inside a cell, so cells cannot be safely ruled out by a bound.
- **The time part.** The API already returns the unbroken windows with both the Sun and the Earth in view (`apps/api/app/engines/visibility.py:97-109`, `apps/api/app/services/analysis.py:92-94`); the longest run is the longest of these. If "good day" is defined per day, one pass finds the longest run of good days, and prefix sums find the best fixed-length window, both in time proportional to the number of days [Q6]. NASA framed the Artemis III regions by continuous sunlight over a 6.5-day period [Q14].
- **"Good day" is not defined in the code.** The code works with samples and windows, not days. The About text's "longest run of good days" needs a definition, for example "both in view for at least a set share of the day", or the wording "the longest unbroken time with both in view".

### How fast the answer changes over distance

- Earlier studies evaluated every pixel or a fixed list of points; none found used a quadtree in space [Q7–Q13]. De Rosa et al. found areas lit for several months that are only a few hundred metres across, with the illumination dropping to under a month outside them [Q11].
- The repository's error study found that one 80 m pixel moves rise and set times by a median of 30 minutes and by 6.2 hours at the 95th percentile ([error-study.md](error-study.md)).
- A test run on 2026-11-15 with the app's own engines (not saved in the repository): a 125 by 125 grid of 80 m points (about 10 by 10 km) around `shackleton-ridge`, 30 days from 1 January 2027 at 30-minute steps, measuring the longest window with both in view. 57 % of points had no such window; the longest was 331.2 hours. A greedy search that kept one cell per level used 147 point checks and stopped at 302.5 hours. Keeping the best 4 cells used 484 checks (3.1 % of 15,625) and found 331.2 hours. Checking every point took 379 seconds. This is one area and one month, so it shows the risk but proves nothing in general.

A second check on 2026-11-15, with a trial search script that was not kept in the repository: a 10 km square at the same place (128 by 128 points, 78 m apart), 1 to 31 January 2027 at 60-minute steps. Checking every point took 327 seconds and found 331.2 hours, on the east edge of the square. Keeping the best 4 cells scored 826 points and stopped at 321.8 hours; keeping the best 6 scored 1,042 points and found 331.2 hours. Two more squares were checked point by point: Malapert massif (-86.0, 0.0), 1 to 31 March 2027, best 345.5 hours; and Haworth (-86.8, -22.0), 1 to 31 June 2027, best 214.5 hours. Keeping the best 6 found both. A real search would therefore keep at least 6 cells per level.

### What the illustration shows

A small looping box under card 06 on the About page: an area is split into quarters, the best cells are kept (with an amber cell kept because its samples disagree) and every kept cell is split again, down to one point; then a cursor sweeps a 30-day bar and the longest run with the Sun and the Earth both in view is outlined. The map and the days are made up, and the box says so. The loop has a Pause button.

## 07. Emergency landing mode

A team member's review on 15 November 2026 proposed an emergency button: from the craft's position, point at once to the nearest good landing spot, with the position given for the demo as a distance from the site and two angles from the site's vertical. The About page's card 07 does this on made-up spots (`apps/web/src/features/future-scope/components/emergency-demo.tsx`); each spot carries a letter, and a legend says which colour means the Sun and the Earth are in view. The two angles are the angle from the vertical and the direction of that tilt, clockwise from north, as in the project's conventions. From them follow the height above the ground and the point under the craft; over a few tens of km the ground is drawn flat. The map is a top view, so the craft's height does not show and a position looks closer to the site than its distance; a note under the map says so (a team member's review of the simulation, 15 November 2026). A real version would take the position from the craft's navigation, for example the terrain-relative navigation of section 05, and ask the API which spots have the Sun and the Earth in view at the landing time. Reachability (fuel, speed, orbit) is not modelled.

## Sources

- S1. Speyerer et al., "Quantifying crater production and regolith overturn on the Moon with temporal imaging", *Nature* 538 (2016), doi:10.1038/nature19829.
- S2. NASA, "Earth's Moon Hit by Surprising Number of Meteoroids", 13 October 2016, https://www.nasa.gov/press-release/goddard/2016/lro-lunar-cratering
- S3. NASA GSFC and ASU, LROC instrument specifications, https://lroc.im-ldi.com/about/specs
- S4. Lawrence et al., LROC NAC targeting constraints, LPSC 40 (2009), abstract 2316, https://ser.im-ldi.com/LSM/files/LROC_TargetingConstraints_SJL_Final_Secured.pdf
- S5. LROC, "Operations Journal: Rolling LRO", 8 September 2011, https://lroc.im-ldi.com/posts/389
- S6. NASA, "NASA's LRO Images Intuitive Machine's Odysseus Lander", 26 February 2024, https://www.nasa.gov/missions/lro/nasas-lro-images-intuitive-machines-odysseus-lander/
- S7. ISRO, "Payloads Data & Science Handbook" (to confirm), https://www.isro.gov.in/media_isro/pdf/science/hand_book_payloads_data_and_science.pdf
- S8. Durga Prasad et al., "Chandrayaan-3 Alternate Landing Site: Pre-Landing Characterisation", arXiv:2308.10712, https://arxiv.org/abs/2308.10712
- S9. ASU, ShadowCam (to confirm), https://www.shadowcam.asu.edu/about
- S10. NASA Science, "New Craters on the Moon", https://science.nasa.gov/resource/new-craters-on-the-moon
- S11. NASA Scientific Visualization Studio, "Gardening Rates on the Moon" (ID 4505), https://svs.gsfc.nasa.gov/4505/
- S12. Bickel et al., "Impacts drive lunar rockfalls over billions of years", *Nature Communications* 11 (2020), doi:10.1038/s41467-020-16653-3
- S13. NASA, "Safe and Precise Landing – Integrated Capabilities Evolution (SPLICE)", https://www.nasa.gov/directorates/spacetech/game_changing_development/projects/SPLICE/about
- S14. Ward et al., "Lidar-Based Safe Site Relative Navigation", AIAA SciTech 2024, https://ntrs.nasa.gov/api/citations/20230015916/downloads/SPLICE_Nav2024_Scitech_Paper.pdf
- S16. Karlgaard et al., "Navigation Doppler Lidar Performance Assessment … IM-1", AAS 25-519, https://ntrs.nasa.gov/api/citations/20250008015/downloads/AAS_NDL_Karlgaard.pdf
- S18. ISRO, "Chandrayaan-3 Details", https://www.isro.gov.in/Chandrayaan3_Details.html
- S19. JAXA ISAS, "Results from the Moon Landing" (SLIM), 25 January 2024, https://global.jaxa.jp/press/2024/01/file/jaxa_doc01_20240125_e.pdf
- S20. NASA, "Artemis III", https://www.nasa.gov/mission/artemis-iii/
- S22. Restrepo et al., "Building Lunar Maps for Terrain Relative Navigation and Hazard Detection Applications", https://ntrs.nasa.gov/api/citations/20210024816/downloads/LuNaMaps_Scitech2022_Nov19.pdf
- S23. Landon et al., NASA/TM-20250003885, communication delay research, https://ntrs.nasa.gov/api/citations/20250003885/downloads/NASA%20TM20250003885.pdf
- S24. Morabito and Heckman, "LRO K-band (26 GHz) Signal Analysis", IPN Progress Report 42-222, https://ipnpr.jpl.nasa.gov/progress_report/42-222/42-222B.html
- S25. NASA, "Artemis Human Landing System Overview", Space Apps Challenge 2025, https://ntrs.nasa.gov/api/citations/20250009323/downloads/ArtemisOverview2025IntSPAPPSChallenge.pdf
- S27. NASA, "Apollo 11 Mission Overview", https://www.nasa.gov/missions/apollo/apollo-11/apollo-11-mission-overview/
- S29. Kumar et al., "Real-Time Retargeting Using Controllability Boundary for Chandrayaan-3 Lunar Landing", arXiv:2605.29412, https://arxiv.org/abs/2605.29412
- Q1. Finkel and Bentley, "Quad trees: a data structure for retrieval on composite keys", *Acta Informatica* 4 (1974), doi:10.1007/BF00288933
- Q2. Samet, "The Quadtree and Related Hierarchical Data Structures", *ACM Computing Surveys* 16(2) (1984), https://www.cs.umd.edu/users/hjs/pubs/SameCSUR84-ocr.pdf
- Q3. Jones, Perttunen and Stuckman, "Lipschitzian optimization without the Lipschitz constant", *JOTA* 79 (1993), doi:10.1007/BF00941892
- Q4. Finkel and Kelley, "Convergence analysis of the DIRECT algorithm" (2004), https://optimization-online.org/wp-content/uploads/2004/08/934.pdf
- Q6. Laaksonen, *Competitive Programmer's Handbook* (draft 3 July 2018), sections 8.1, 8.3 and 9.1, https://cses.fi/book/book.pdf
- Q7. Mazarico et al., "Illumination conditions of the lunar polar regions using LOLA topography", *Icarus* 211 (2011), https://ntrs.nasa.gov/citations/20120010094
- Q8. NASA Goddard PGDA, "Lunar Polar Illumination", product 69, https://pgda.gsfc.nasa.gov/products/69
- Q9. Gläser et al., *Icarus* 243 (2014), https://elib.dlr.de/94240/
- Q10. Gläser et al., *Planetary and Space Science* 162 (2018), https://elib.dlr.de/119091
- Q11. De Rosa et al., "Characterisation of potential landing sites for the European Space Agency's Lunar Lander project", arXiv:1208.5587, https://arxiv.org/abs/1208.5587
- Q12. Speyerer and Robinson, "Persistently illuminated regions at the lunar poles", *Icarus* 222 (2013), product page https://data.lroc.im-ldi.com/lroc/view_rdr/WAC_POLE_ILL_PCT_SOUTH
- Q13. Peña-Asensio et al., "Evaluating potential landing sites for the Artemis III mission using a multi-criteria decision making approach", arXiv:2406.19863, https://arxiv.org/abs/2406.19863
- Q14. NASA, "NASA Identifies Candidate Regions for Landing Next Americans on Moon", 19 August 2022, https://www.nasa.gov/news-release/nasa-identifies-candidate-regions-for-landing-next-americans-on-Moon/
