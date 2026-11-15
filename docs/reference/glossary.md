# Glossary

Last updated: 2026-11-15.

Terms used in the app and in these documents, in plain words. The assistant's `apps/api/app/data/knowledge/glossary.md` holds the terms a user meets in the app, taken from this file.

## Position and direction

**Azimuth.** The compass direction of something in the sky, in degrees clockwise from north: 0 north, 90 east, 180 south, 270 west.

**Elevation.** How high something is in the sky, in degrees above the level horizon. 0 is on the horizon, 90 is straight up, negative is below.

**Horizon profile.** For a given site, how high the terrain rises above the level horizon in each compass direction. We store one value per degree, 360 in all.

**Clearance.** A body's elevation minus the terrain's height in that direction. Positive means it is above the terrain and visible.

**Latitude and longitude on the Moon.** As on Earth. Latitude runs from -90 at the south pole to +90 at the north pole. Longitude is measured east from the centre of the side that faces the Earth.

**Sub-solar point.** The spot on the Moon where the Sun is directly overhead at a given moment. The **sub-Earth point** is the same for the Earth.

## Time

**Lunar day.** The time from one noon to the next at a place on the Moon, about 29.5 Earth days. Away from the poles that is roughly two weeks of daylight and two weeks of night.

**UTC.** The world's reference time. The API and the `t=` value in a link use UTC. Most times on the pages are in the visitor's own time zone; the day cards of a site's sky forecast, its "When to leave Earth" times, the accuracy page and the assistant use UTC.

**Sunrise, sunset, Earthrise, Earthset.** The moments the Sun or the Earth crosses the terrain horizon as seen from the site. Over most of the Moon the Earth never rises or sets; it stays in about the same place. Near the poles and the edge of the near side it hovers at the horizon, and terrain and libration make it appear and disappear.

**Window.** A continuous period during which the Sun, the Earth, or both are visible.

## The Moon

**Libration.** A slow rocking of the Moon as seen from the Earth, caused by the shape and tilt of its orbit. Seen from the Moon, it makes the Earth drift by several degrees over a month. At the poles that is enough to take the Earth below the horizon.

**South pole region.** The area around the Moon's south pole. The Sun is always near the horizon there, so high ground can be lit most of the time while crater floors nearby never see the Sun.

**Permanently shadowed region.** A place, usually a crater floor near a pole, that sunlight never reaches. These are extremely cold and may hold water ice.

**Terrain, relief.** The shape of the ground: mountains, ridges, crater rims and floors.

**Reference sphere.** A perfect ball of radius 1737.4 km used as "sea level" for the Moon. Heights are measured from it.

## Data and tools

**Ephemeris.** A table or file giving the positions of bodies in the solar system over time.

**Kernel.** A data file in the format NASA's navigation software uses, holding an ephemeris or the orientation of a body.

**JPL Horizons.** NASA's online service that computes where solar system bodies are, for any observer and time. We use it as the reference to check our positions.

**LRO.** Lunar Reconnaissance Orbiter, a NASA spacecraft that has mapped the Moon since 2009.

**LOLA.** Lunar Orbiter Laser Altimeter, the instrument on LRO that measured the height of the surface. Our terrain comes from it.

**Elevation grid (DEM).** A map in which each pixel holds the height of the ground. DEM stands for digital elevation model.

**Polar stereographic projection.** A way of drawing the area around a pole on a flat map, with the pole at the centre.

**Quickmap, Moon Trek.** Online tools for exploring images and maps of the Moon.

**PGDA.** The Planetary Geodesy Data Archive at NASA Goddard, which publishes LOLA products and the polar illumination maps.

## Missions

**CLPS.** Commercial Lunar Payload Services, the NASA programme that pays companies to deliver instruments to the Moon.

**Artemis.** NASA's programme to return people to the Moon. Its candidate landing regions are near the south pole.

**Direct-to-Earth communication.** A radio link straight from the lander to antennas on Earth, with no relay satellite. It needs the Earth to be above the horizon.

## In the app

**Scenario.** One site together with one time range. The app analyses up to four at once.

**Curated site.** A site from our list, as opposed to coordinates you enter yourself.

**Go, caution, no-go.** The API's summary for power and for communication, based on thresholds applied to the metrics. The web app does not show it; the assistant can report it. It is a guide, not a mission decision.

**Sunlight fraction.** The share of the time range during which the Sun is visible from the site.

**Fallback data.** A saved result shown when the live calculation cannot be reached. Planned, not built.
