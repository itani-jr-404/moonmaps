# Glossary

Last updated: 2026-11-15.

Terms a visitor meets in Moon Maps or in the assistant's answers, trimmed from the project glossary.

## Words on the page

**Good landing site, Bad landing site.** "Good" means that at the chosen moment the Sun is above the terrain horizon (power for solar panels) and the Earth is above it too (direct radio contact). If either is hidden, the page says "Bad". Slopes, rocks and safety are not judged.

**Good day, Good for some hours, Not good.** The 30-day calendar's grades. A good day has at least 18 hours with both the Sun and the Earth visible; "Good for some hours" has fewer; "Not good" has none. Days follow the visitor's time zone.

**Best times.** Up to four of the longest periods in the next 30 days when the Sun and the Earth are both visible.

**Curated site.** A place from the app's own list, with a source for its coordinates.

**Smooth Moon.** A perfect ball with a level horizon. The app uses it only if no elevation data is loaded; normally every place has a terrain horizon from LOLA.

## Position and direction

**Azimuth.** The compass direction of something in the sky, in degrees clockwise from north: 0 north, 90 east, 180 south, 270 west.

**Elevation.** How high something is in the sky, in degrees above the level horizon. 0 is on the horizon, 90 is straight up, negative is below.

**Terrain horizon.** Where the ground meets the sky, seen from the site. Hills and crater rims raise it above the level horizon. The app stores its height for each whole degree of azimuth (the horizon profile).

**Clearance.** A body's elevation minus the terrain's height in that direction. Positive means visible.

**Latitude and longitude.** As on Earth. Latitude runs from -90 at the south pole to +90 at the north pole. Longitude is measured east from the centre of the side that faces the Earth.

**Sub-solar point, sub-Earth point.** The spot on the Moon where the Sun, or the Earth, is directly overhead at a given moment.

## Time

**Lunar day.** From one noon to the next at a place on the Moon, about 29.5 Earth days.

**UTC.** The world's reference time. The API works in UTC, and so does the `t=` value in a shared link. Most times on the pages are in the visitor's own time zone. The day cards of a site's sky forecast, its "When to leave Earth" times, the Accuracy page and the assistant use UTC.

**Sunrise, sunset, Earthrise, Earthset.** The moments the Sun or the Earth crosses the terrain horizon as seen from the site. Over most of the Moon the Earth stays in about the same place in the sky. Near the poles it hovers at the horizon, and terrain and libration make it appear and disappear.

**Window.** A continuous period during which the Sun, the Earth, or both are visible.

## The Moon

**Libration.** A slow rocking of the Moon as seen from the Earth. Seen from the Moon, it makes the Earth drift by several degrees over a month, enough at the poles to take it below the horizon.

**South pole region.** The Sun is always near the horizon there, so high ground can be lit most of the time while nearby crater floors never see the Sun.

**Permanently shadowed region.** A place, usually a crater floor near a pole, that sunlight never reaches. These are extremely cold and may hold water ice.

## Data and tools

**Ephemeris.** A table or file giving the positions of bodies in the solar system over time. A **kernel** is such a file in the format NASA's navigation software uses.

**JPL Horizons.** NASA's online service that computes where solar system bodies are, for any observer and time. The team uses it to check the app's positions.

**LRO and LOLA.** The Lunar Reconnaissance Orbiter, a NASA spacecraft mapping the Moon since 2009, and its Lunar Orbiter Laser Altimeter, which measured surface heights. The app's terrain comes from LOLA.

**Elevation grid (DEM).** A map in which each pixel holds the height of the ground (digital elevation model).

**PGDA.** The Planetary Geodesy Data Archive at NASA Goddard. Its polar illumination maps were used to check the app.

## Missions

**Artemis.** NASA's programme to return people to the Moon. Its candidate landing regions are near the south pole.

**CLPS.** Commercial Lunar Payload Services, the NASA programme that pays companies to deliver instruments to the Moon.

**Direct-to-Earth communication.** A radio link straight from the lander to Earth, with no relay satellite. It needs the Earth above the horizon.

## In the assistant's answers

**Scenario.** One site with one time range. The API analyses up to four at once.

**Sunlight fraction.** The share of a time range with the Sun visible. The API also gives the shares for the Earth and for both.

**Go, caution, no-go.** The API's summary for power and for communication, from thresholds on the metrics. The page does not show it. It is a guide, not a mission decision.

## Sources

- `docs/reference/glossary.md`.
- Page wording and thresholds: `apps/web/src/features/landing/lib/verdict.ts`, `apps/web/src/features/planner/lib/calendar.ts`, `apps/web/src/lib/format/format.ts`.
- `docs/science/terrain-and-horizon.md`, `docs/science/visibility-and-metrics.md`, `apps/api/app/schemas/analyze.py`.
