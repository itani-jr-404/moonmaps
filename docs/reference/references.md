# References

Last updated: 2026-11-14.

Everything the project uses or cites: data, tools, code and reading. Add a line here in the same pull request that adds a dependency, a dataset or an asset. The submission form asks for this list.

## The challenge

1. NASA Space Apps Challenge 2026, "Lunar Landing Site Navigator", challenge page and resources. https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/

## NASA data and resources

2. NASA Jet Propulsion Laboratory, Horizons System. https://ssd.jpl.nasa.gov/horizons/ ; API documentation: https://ssd-api.jpl.nasa.gov/doc/horizons.html ; API endpoint used by `apps/api/scripts/fetch_horizons.py`: https://ssd.jpl.nasa.gov/api/horizons.api (values fetched 2026-11-14).
3. NASA JPL, Navigation and Ancillary Information Facility (NAIF), generic kernels: DE421 ephemeris (`de421.bsp`), lunar frame kernel (`moon_080317.tf`), planetary constants (`pck00008.tpc`) and lunar orientation (`moon_pa_de421_1900-2050.bpc`). https://naif.jpl.nasa.gov/pub/naif/generic_kernels/ (downloaded 2026-11-14; file addresses in [data/sources.md](../data/sources.md)).
4. NASA Lunar Reconnaissance Orbiter, Lunar Orbiter Laser Altimeter (LOLA) gridded elevation, south pole. Browse: https://imbrium.mit.edu/BROWSE/LOLA_GDR/POLAR/SOUTH_POLE ; files: https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG/ (`LDEM_80S_80M`, `LDEM_75S_120M`, downloaded 2026-11-14).
5. LOLA PDS label of the 80 m south polar grid. https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG/LDEM_80S_80M.LBL (read 2026-11-14). The `LDEM_75S_120M.LBL` label is at the same address pattern.
6. LOLA catalogue, polar stereographic map projection description, DSMAP_POLAR.CAT. https://imbrium.mit.edu/CATALOG/DSMAP_POLAR.CAT (read 2026-11-14).
7. NASA Goddard, Planetary Geodesy Data Archive, lunar polar illumination maps. https://pgda.gsfc.nasa.gov/products/69
8. NASA Goddard, Planetary Geodesy Data Archive, high-resolution LOLA models of south pole sites. https://pgda.gsfc.nasa.gov/products/78
9. NASA's Scientific Visualization Studio, CGI Moon Kit (ID 4720). https://svs.gsfc.nasa.gov/4720 (read 2026-11-14). Files used: `lroc_color_2k.jpg`, `ldem_3_8bit.jpg`. Usage terms: https://svs.gsfc.nasa.gov/help/ (read 2026-11-14).
10. NASA, Blue Marble. https://visibleearth.nasa.gov/collection/1484/blue-marble
11. NASA 3D Resources. https://science.nasa.gov/3d-resources/ ; models used: https://science.nasa.gov/3d-resources/apollo-lunar-module/ , https://science.nasa.gov/3d-resources/z2-spacesuit/ , https://science.nasa.gov/3d-resources/astronaut/ ; GitHub mirror: https://github.com/nasa/NASA-3D-Resources (all read 2026-11-14). Details in [research/web-assets.md](../../research/web-assets.md).
12. NASA Images and Media Usage Guidelines. https://www.nasa.gov/nasa-brand-center/images-and-media/ (read 2026-11-14).
13. Arizona State University and NASA LRO, Quickmap. https://quickmap.lroc.asu.edu/
14. NASA, Moon Trek. https://trek.nasa.gov/moon/
14b. NASA NSSDCA, Sun Fact Sheet, Dr. David R. Williams, last updated 9 May 2024. https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html (read 2026-11-14). The Sun's radius in the comparison with NASA's maps.
14c. NASA NSSDCA spacecraft pages for Apollo 11, Apollo 15 and Apollo 17 (launch and landing times). https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059A , https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-063A , https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1972-096A (read 2026-11-14).
14d. Brian W. Lawrence, "Sun Angles", Apollo Lunar Surface Journal, last revised 8 February 1999. https://www.apollojournals.org/alsj/sunangles.html (read 2026-11-14).
14e. LOLA polar illumination and Earth-visibility maps (PGDA product 69): `AVGVISIB_75S_120M_201608` and `AVGVISIB_75S_120M_201608_EARTH`. https://imbrium.mit.edu/EXTRAS/ILLUMINATION/IMG/ (downloaded 2026-11-14).
14a. NASA NSSDCA, Moon Fact Sheet, Dr. David R. Williams, last updated 11 January 2024. https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html (read 2026-11-14). Used for the distance and radius checks in [VALIDATION.md](../VALIDATION.md).

## Site coordinates

Every page used for a coordinate or a landing date, with its owner and the date it was read, is listed in [research/site-coordinates.md](../../research/site-coordinates.md). The main ones:

15. LROC (Arizona State University / NASA GSFC) image pages: https://lroc.im-ldi.com/images/1247 , /1294 , /1408 , /1314 , /938 , /1358 , /1087 , /1374 (read 2026-11-14).
16. USGS Astrogeology, Lunar LRO NAC Haworth Photoclinometry DEM 1m. https://astrogeology.usgs.gov/search/map/lunar_lro_nac_haworth_photoclinometry_dem_1m (read 2026-11-14).
17. IAU WGPSN / USGS, Gazetteer of Planetary Nomenclature, Mons Mouton. https://planetarynames.wr.usgs.gov/Feature/16070 (read 2026-11-14).
18. Peña-Asensio, Neira-Acosta, Sánchez-Lozano, "Evaluating potential landing sites for the Artemis III mission using a multi-criteria decision making approach", arXiv:2406.19863 v2. https://arxiv.org/abs/2406.19863 (read 2026-11-14).
19. Marshall et al., "Locating the LCROSS Impact Craters", arXiv:1103.1687. https://arxiv.org/abs/1103.1687 (read 2026-11-14).
20. NASA Space Science Data Coordinated Archive, Apollo 11, 15 and 17 pages and "Apollo Landing Site Coordinates". https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html (read 2026-11-14).

## Space agency partner resources

21. Canadian Space Agency, Moon Exploration. https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/

## Papers

22. Mazarico, E., Neumann, G. A., Smith, D. E., Zuber, M. T., Torrence, M. H. (2011). Illumination conditions of the lunar polar regions using LOLA topography. Icarus 211, 1066-1081. doi:10.1016/j.icarus.2010.10.030

## Software

Versions are the ones installed from the lock files (`apps/api/uv.lock`, `pnpm-lock.yaml`) on 2026-11-14. Licences are as declared in each package's own metadata (its `package.json` or Python package metadata) on that date; the npm entries for `gsap` and `@gltf-transform/cli` were also checked with `npm view <package> license`.

### API (Python 3.12)

| Library | Version | Licence | Used for | Link |
| --- | --- | --- | --- | --- |
| FastAPI | 0.162.7 | MIT | The API | https://fastapi.tiangolo.com/ |
| Starlette (through FastAPI) | 1.10.0 | BSD-3-Clause | Web framework under FastAPI | https://www.starlette.io/ |
| uvicorn | 0.54.0 | BSD-3-Clause | Running the API | https://www.uvicorn.org/ |
| Pydantic | 2.14.3 | MIT | Request and response models | https://docs.pydantic.dev/ |
| pydantic-settings | 2.16.3 | MIT | Configuration from the environment | https://docs.pydantic.dev/latest/concepts/pydantic_settings/ |
| Skyfield | 1.55 | MIT | Positions of the Sun and the Earth | https://rhodesmill.org/skyfield/ ; "Planetary reference frames": https://rhodesmill.org/skyfield/planetary.html |
| jplephem (through Skyfield) | 2.24 | MIT | Reading JPL kernels | https://github.com/brandon-rhodes/python-jplephem |
| numpy | 2.5.4 | BSD-3-Clause AND 0BSD AND MIT AND Zlib AND CC0-1.0 | Array calculations, reading elevation grids | https://numpy.org/ |
| pytest (development) | 9.2.0 | MIT | Tests | https://docs.pytest.org/ |
| httpx (development) | 0.28.1 | BSD-3-Clause | The test client | https://www.python-httpx.org/ |
| ruff (development) | 0.17.5 | MIT | Lint and format | https://docs.astral.sh/ruff/ |
| uv | 0.13.8 on the development laptop; 0.9 in the Docker image | To confirm | Python environments and packages | https://docs.astral.sh/uv/ |

### Web app

| Library | Version | Licence | Used for | Link |
| --- | --- | --- | --- | --- |
| Next.js | 16.4.6 | MIT | The web app | https://nextjs.org/ |
| React, React DOM | 19.3.1 | MIT | The interface | https://react.dev/ |
| TypeScript | 5.9.3 | Apache-2.0 | Types | https://www.typescriptlang.org/ |
| Tailwind CSS, @tailwindcss/postcss | 4.3.5 | MIT | Styling and design tokens | https://tailwindcss.com/ |
| three.js | 0.187.0 | MIT | 3D scenes, used directly; its Meshopt decoder loads the compressed model | https://threejs.org/ |
| @types/three | 0.187.0 | MIT | Types for three.js | https://www.npmjs.com/package/@types/three |
| GSAP | 3.15.1 | GSAP Standard "no charge" licence, https://gsap.com/standard-license | Scroll-linked animation | https://gsap.com/ |
| Lenis | 1.3.27 | MIT | Smooth scrolling | https://lenis.darkroom.engineering/ |
| TanStack Query | 5.107.1 | MIT | Fetching and caching API data | https://tanstack.com/query |
| openapi-fetch | 0.17.0 | MIT | Typed API client | https://openapi-ts.dev/openapi-fetch/ |
| zustand | 5.1.0 | MIT | The scenario store | https://zustand.docs.pmnd.rs/ |
| zod | 4.6.7 | MIT | Checking input | https://zod.dev/ |
| clsx | 2.1.1 | MIT | Class names | https://github.com/lukeed/clsx |
| tailwind-merge | 3.7.0 | MIT | Merging Tailwind classes | https://github.com/dcastil/tailwind-merge |
| Vitest (development) | 5.1.0 | MIT | Tests | https://vitest.dev/ |
| Playwright, @playwright/test (development) | 1.65.1 | Apache-2.0 | End-to-end browser tests | https://playwright.dev/ |
| @vitejs/plugin-react (development) | 6.3.0 | MIT | React in Vitest | https://github.com/vitejs/vite-plugin-react |
| Testing Library for React (development) | 16.3.3 | MIT | Component tests | https://testing-library.com/ |
| jsdom (development) | 31.0.1 | MIT | Browser environment for tests | https://github.com/jsdom/jsdom |
| ESLint (development) | 9.39.5 | MIT | Lint | https://eslint.org/ |
| eslint-config-next (development) | 16.4.6 | MIT | Next.js lint rules | https://nextjs.org/docs/app/api-reference/config/eslint |

### Contract and repository tooling

| Library | Version | Licence | Used for | Link |
| --- | --- | --- | --- | --- |
| openapi-typescript | 7.13.0 | MIT | Generating `api.d.ts` from `openapi.json` | https://openapi-ts.dev/ |
| Prettier | 3.10.1 | MIT | Formatting | https://prettier.io/ |
| prettier-plugin-tailwindcss | 0.8.1 | MIT | Sorting Tailwind classes | https://github.com/tailwindlabs/prettier-plugin-tailwindcss |
| husky | 9.1.7 | MIT | Git pre-commit hook | https://typicode.github.io/husky/ |
| lint-staged | 17.6.0 | MIT | Checking staged files | https://github.com/lint-staged/lint-staged |
| pnpm | 11.3.0 (pinned in `package.json`) | To confirm | Installing web packages | https://pnpm.io/ |
| glTF-Transform CLI | 4.5.1, run once by hand, not a dependency | MIT | Compressing `Z2Spacesuit.glb` | https://gltf-transform.dev/ |
| GitHub Actions (`actions/checkout`, `actions/setup-node`, `actions/setup-python`) | v4, v4, v5 | To confirm | Running the checks on every pull request | https://docs.github.com/actions |

### Fonts

Loaded with `next/font/google` in `apps/web/src/app/layout.tsx`.

| Font | Used for | Licence | Link |
| --- | --- | --- | --- |
| Exo 2 | Display text | To confirm | https://fonts.google.com/specimen/Exo+2 |
| Jost | Body text | To confirm | https://fonts.google.com/specimen/Jost |
| JetBrains Mono | Numbers and labels | To confirm | https://fonts.google.com/specimen/JetBrains+Mono |

Not used: React Three Fiber, drei, shadcn/ui, Chart.js, React Bits. See [ADR-010](../decisions/ADR-010-threejs-directly.md) and [ADR-012](../decisions/ADR-012-visual-styling.md).

## Design references

- Prompt Motion, a library of motion design examples with source code. Used as a reference for the landing page scenes and the demo video. https://www.promptsmotion.com

## Images and textures

Listed with their owners and credit lines in [data/sources.md](../data/sources.md). Add any new image here and there.

## How to cite a new source

Give the owner, the title, the address, and the date you accessed it if the page may change. For data, also give the file names used.
