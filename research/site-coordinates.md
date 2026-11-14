# Site coordinates: sources and conversions

Last updated: 2026-11-14.

Where each coordinate in `apps/api/app/data/sites.json` came from. All values were read on 2026-11-14. The project convention is latitude south negative and longitude east-positive in -180 to 180 (see [docs/science/conventions-and-ephemeris.md](../docs/science/conventions-and-ephemeris.md)). Where the source used 0 to 360 east or a west longitude, the conversion is written in the "Conversion" column.

None of these points has yet been opened in Quickmap, as step 3 of [docs/data/sites.md](../docs/data/sites.md) asks. That check is still to do.

## Sites in the list

| id | As written in the source | Value in `sites.json` (lat, lon) | Conversion | Source title | Owner | URL |
| --- | --- | --- | --- | --- | --- | --- |
| `shackleton-ridge` | 89.684°S, 196.739°E (ridge meets Shackleton rim) | -89.684, -163.261 | 196.739 - 360 = -163.261 | Traversing the Shackleton de Gerlache Ridge (published by Mark Robinson, 1 April 2022) | LROC, Arizona State University / NASA GSFC | https://lroc.im-ldi.com/images/1247 |
| `malapert-massif` | 86°S, 0°E ("the heart of the Artemis 3 landing region") | -86.0, 0.0 | none | Malapert Massif (Mark Robinson, 14 March 2023) | LROC, ASU / NASA GSFC | https://lroc.im-ldi.com/images/1294 |
| `haworth` | "centered at 338.0 (-21.0) E, -86.8 S" (area beyond the north rim of Haworth crater) | -86.8, -22.0 | 338.0 - 360 = -22.0. The page's own "(-21.0)" does not match 338.0; its bounding box corners (334.3 to 343.4 E) support 338.0, so -22.0 is used | Lunar LRO NAC Haworth Photoclinometry DEM 1m (authors NASA Ames; originators Molly O'Connor, Ross A. Beyer; published 2021-01-15) | USGS Astrogeology Science Center | https://astrogeology.usgs.gov/search/map/lunar_lro_nac_haworth_photoclinometry_dem_1m |
| `mons-mouton` | Center latitude -84.60°, center longitude 31.00° (Planetographic, +East, -180 - 180) | -84.6, 31.0 | none | Gazetteer of Planetary Nomenclature: Mons Mouton (approved 13 May 2022) | IAU WGPSN / USGS | https://planetarynames.wr.usgs.gov/Feature/16070 |
| `nobile-rim-2` | 84°12'5.61"S (-84.20156°), 60°41'59.61"E (60.69989°), point 358, site DM2 | -84.20156, 60.69989 | none (the paper gives the decimals) | Peña-Asensio, Neira-Acosta, Sánchez-Lozano, "Evaluating potential landing sites for the Artemis III mission using a multi-criteria decision making approach", arXiv:2406.19863 v2 (22 Oct 2024), Table 3 | The authors (arXiv) | https://arxiv.org/abs/2406.19863 |
| `de-gerlache-rim-2` | 88°30'56.38"S, 61°10'2.35"O, point 726, site SL2 | -88.51566, -61.16732 | DMS to decimal: 88 + 30/60 + 56.38/3600 = 88.51566; 61 + 10/60 + 2.35/3600 = 61.16732. "O" read as west (Spanish "oeste"); see notes | Same paper, Table 3 | The authors (arXiv) | https://arxiv.org/abs/2406.19863 |
| `amundsen-rim` | 84°11'30.63"S, 67°13'44.55"E, point 1121, site DM1 | -84.19184, 67.22904 | DMS to decimal: 84 + 11/60 + 30.63/3600 = 84.19184; 67 + 13/60 + 44.55/3600 = 67.22904 | Same paper, Table 3 | The authors (arXiv) | https://arxiv.org/abs/2406.19863 |
| `cabeus-lcross` | Weighted average Centaur impact location -84.6796°, -48.7093° (Mean Earth, selenocentric); impact 9 October 2009, 11:31:19.506 UTC | -84.6796, -48.7093 | none (already signed, west negative) | Marshall et al., "Locating the LCROSS Impact Craters", arXiv:1103.1687 (submitted 9 March 2011) | The authors (arXiv) | https://arxiv.org/abs/1103.1687 |
| `south-pole-reference` | Chosen by the team: 0°E, 89.9°S, the point of the JPL Horizons check in [data-source-notes.md](data-source-notes.md) | -89.9, 0.0 | none | JPL Horizons System | NASA JPL | https://ssd.jpl.nasa.gov/horizons/ |
| `im-2` | 84.7906° S, 29.1957° E (Athena on its side in a 20 m crater); landed 06 March 2025 | -84.7906, 29.1957 | none | IM-2 Athena Seen Obliquely (Mark Robinson, 10 March 2025) | LROC, ASU / NASA GSFC | https://lroc.im-ldi.com/images/1408 |
| `chandrayaan-3` | 69.3741°S, 32.32°E, 532 m elevation; touched down 23 August 2023 | -69.3741, 32.32 | none | Chandrayaan-3 Landing Site (Mark Robinson, 5 September 2023) | LROC, ASU / NASA GSFC | https://lroc.im-ldi.com/images/1314 |
| `apollo-11` | Apollo 11 LM: 0.67416, 23.47314 (mean observed lat, lon; ME system) | 0.67416, 23.47314 | none | Spacecraft Related Coordinates - 2016 Update (Mark Robinson, 25 November 2016) | LROC, ASU / NASA GSFC | https://lroc.im-ldi.com/images/938 |
| `apollo-15` | Apollo 15 LM: 26.13239, 3.63330 | 26.13239, 3.6333 | none (JSON drops the trailing zero) | Same page | LROC | https://lroc.im-ldi.com/images/938 |
| `apollo-17` | Apollo 17 LM: 20.1911, 30.7723 | 20.1911, 30.7723 | none | Same page | LROC | https://lroc.im-ldi.com/images/938 |
| `slim` | 13.3160°S, 25.2510°E, -912 m elevation; landed 19 January 2024 at 15:20 UTC | -13.316, 25.251 | none | JAXA SLIM Landing (Mark Robinson, 26 January 2024) | LROC, ASU / NASA GSFC | https://lroc.im-ldi.com/images/1358 |
| `change-4` | 45.457°S, 177.589°E, plus or minus 20 m; landed 3 January 2019 | -45.457, 177.589 | none | Chang'e 4 Lander Coordinates (Mark Robinson, 11 January 2019) | LROC, ASU / NASA GSFC | https://lroc.im-ldi.com/images/1087 |
| `change-6` | 41.6385°S, 206.0148°E, -5256 m, plus or minus 30 m; landed 1 June 2024 | -41.6385, -153.9852 | 206.0148 - 360 = -153.9852 | First Look: Chang'e 6 (Robert Wagner, 14 June 2024) | LROC, ASU / NASA GSFC | https://lroc.im-ldi.com/images/1374 |

The LROC site has moved from `www.lroc.asu.edu` to `lroc.im-ldi.com`; the old addresses redirect there.

## Landing dates

| id | Date | Source |
| --- | --- | --- |
| `apollo-11` | 20 July 1969, 20:17:40 UT | NSSDC, Apollo 11, https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo11info.html |
| `apollo-15` | 30 July 1971, 22:16:29 UT | NSSDC, Apollo 15, https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo15info.html |
| `apollo-17` | 11 December 1972, 19:54:57 UT | NSSDC, Apollo 17, https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo17info.html |
| `cabeus-lcross` | 9 October 2009, 11:31:19.506 UTC | Marshall et al., arXiv:1103.1687 |
| `chandrayaan-3`, `im-2`, `slim`, `change-4`, `change-6` | As in the table above | The LROC page of each site |

The dates of `chandrayaan-3`, `im-2`, `change-4` and `change-6` are the dates the LROC pages give, without a time; that they are UTC dates is to confirm.

## Supporting sources

- NASA, "NASA Identifies Candidate Regions for Landing Next Americans on Moon", 19 August 2022, https://www.nasa.gov/news-release/nasa-identifies-candidate-regions-for-landing-next-americans-on-moon/ . The 13 regions: Faustini Rim A, Peak Near Shackleton, Connecting Ridge, Connecting Ridge Extension, de Gerlache Rim 1, de Gerlache Rim 2, de Gerlache-Kocher Massif, Haworth, Malapert Massif, Leibnitz Beta Plateau, Nobile Rim 1, Nobile Rim 2, Amundsen Rim. Each about 15 by 15 km. No coordinates given.
- George, Rubio, Lawrence, Curell (NASA), "Artemis III Site Selection Update: Downselection from Thirteen to Nine Candidate Regions", LPSC 2026 abstract, NTRS 20250011660, https://ntrs.nasa.gov/citations/20250011660 . The nine regions of October 2024: Peak near Cabeus B, Haworth, Malapert Massif, Mons Mouton Plateau, Mons Mouton, Nobile Rim 1, Nobile Rim 2, de Gerlache Rim 2, Slater Plain. No coordinates given.
- NSSDC, "Apollo Landing Site Coordinates", https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html . Gives the same Apollo 11 LM values as LROC (0.67416, 23.47314), ME system, DE421, from Wagner et al., Icarus 283 (2017).
- LROC data product "de Gerlache Rim 315-335 degrees sub-solar longitude low-Sun controlled NAC mosaic (C)", centre -88.5, 293.3 (that is -66.7 east-positive), https://data.lroc.im-ldi.com/lroc/view_rdr/NAC_ROI_DEGERRIMLOC . Used only to check that the de Gerlache Rim 2 point lies at west longitudes.
- LROC data product "Malapert Massif low-Sun controlled NAC mosaic (Combined mosaic #1)", centre -86.0, 0.3, https://data.lroc.im-ldi.com/lroc/view_rdr/NAC_ROI_MALAPERTLO1 . Agrees with the 86°S, 0°E point.
- LROC, "IM-2 Landing Region", https://lroc.im-ldi.com/images/1401 . Gives the intended IM-2 site as -84.78°, 29.13°E; the list uses the final resting place instead.
- NASA Goddard PGDA, "High-Resolution LOLA Topography for Lunar South Pole Sites" (product 78, Michael K. Barker), https://pgda.gsfc.nasa.gov/products/78 , and its README, https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/README . The page and the README name the sites (Site01 Connecting ridge, Site04 Shackleton rim, Site23 Malapert massif, Haworth, DM2 Nobile rim 2, and others) but give no latitude or longitude. The grids are in south polar stereographic X/Y metres. A centre for each site could be computed from the grid bounds, but that was not done here.

## Notes and doubts

- **de Gerlache Rim 2 longitude letter.** Table 3 of the arXiv paper writes this one longitude with "O", while every other row uses "E". It was read as west ("oeste" in Spanish, the authors' language). The LROC de Gerlache Rim mosaic centre (-88.5, -66.7) agrees with a west longitude. To confirm with the published version of the paper.
- **Study points are not NASA points.** The Nobile Rim 2, de Gerlache Rim 2 and Amundsen Rim points are the best-ranked points of one published study, not points NASA chose.
- **Haworth longitude.** The source page writes both 338.0 E and -21.0; these differ by 1°. The list uses 338.0 E, which the bounding box supports.
- **Mons Mouton** uses the IAU feature centre, about 20 km from the IM-2 resting place.
- **LCROSS kind.** No kind in [docs/data/sites.md](../docs/data/sites.md) fits an impact point; it is filed as `reference`. A new kind may be needed.
- **Reference point.** `south-pole-reference` is a point the team chose, not a measured site.

## Sites asked for but not sourced

- **Nobile Rim (as a generic "Nobile Rim")**: only Nobile Rim 2 has a sourced point. No point was found for Nobile Rim 1.
- **de Gerlache Rim 1**: no point found; de Gerlache Rim 2 is used instead.
- **Shackleton rim (PGDA Site04)**: the arXiv paper gives a Site04 point (89°57'33.08"S, 135°49'6.44"E), but Site04 is not one of NASA's named Artemis III regions, and the ridge point above already sits on the Shackleton rim. Left out.
- **Mons Mouton Plateau, Peak near Cabeus B, Slater Plain** (2024 Artemis III regions): no published point found.
