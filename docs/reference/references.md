# References

Last updated: 2026-11-14.

Everything the project uses or cites: data, tools, code and reading. Add a line here in the same pull request that adds a dependency, a dataset or an asset. The submission form asks for this list.

## The challenge

1. NASA Space Apps Challenge 2026, "Lunar Landing Site Navigator", challenge page and resources. https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/

## NASA data and resources

2. NASA Jet Propulsion Laboratory, Horizons System. https://ssd.jpl.nasa.gov/horizons/ (API documentation: https://ssd-api.jpl.nasa.gov/doc/horizons.html)
3. NASA Jet Propulsion Laboratory, planetary and lunar ephemerides (DE421) and lunar frame kernels, read through Skyfield.
4. NASA Lunar Reconnaissance Orbiter, Lunar Orbiter Laser Altimeter (LOLA) gridded elevation, south pole. https://imbrium.mit.edu/BROWSE/LOLA_GDR/POLAR/SOUTH_POLE
5. NASA Goddard, Planetary Geodesy Data Archive, lunar polar illumination maps. https://pgda.gsfc.nasa.gov/products/69
6. NASA Goddard, Planetary Geodesy Data Archive, high-resolution LOLA models of south pole sites. https://pgda.gsfc.nasa.gov/products/78
7. NASA's Scientific Visualization Studio, CGI Moon Kit. https://svs.gsfc.nasa.gov/4720
8. NASA, Blue Marble. https://visibleearth.nasa.gov/collection/1484/blue-marble
9. Arizona State University and NASA LRO, Quickmap. https://quickmap.lroc.asu.edu/
10. NASA, Moon Trek. https://trek.nasa.gov/moon/

## Space agency partner resources

11. Canadian Space Agency, Moon Exploration. https://www.asc-csa.gc.ca/eng/astronomy/moon-exploration/

## Papers

12. Mazarico, E., Neumann, G. A., Smith, D. E., Zuber, M. T., Torrence, M. H. (2011). Illumination conditions of the lunar polar regions using LOLA topography. Icarus 211, 1066-1081.

## Software

| Library | Used for | Link |
| --- | --- | --- |
| Skyfield | Positions of the Sun, Earth and planets | https://rhodesmill.org/skyfield/ |
| numpy | Array calculations, reading elevation grids | https://numpy.org/ |
| FastAPI, Pydantic | The API and its models | https://fastapi.tiangolo.com/ |
| Next.js, React | The web app | https://nextjs.org/ |
| Tailwind CSS, shadcn/ui | Styling and base components | https://tailwindcss.com/ , https://ui.shadcn.com/ |
| three.js, React Three Fiber, drei | 3D scenes | https://threejs.org/ , https://r3f.docs.pmnd.rs/ |
| GSAP with ScrollTrigger | Scroll-linked animation | https://gsap.com/ |
| Lenis | Smooth scrolling | https://lenis.darkroom.engineering/ |
| React Bits | Animated interface components | https://reactbits.dev/get-started/index |
| Chart.js | Charts | https://www.chartjs.org/ |
| TanStack Query | Fetching and caching API data | https://tanstack.com/query |
| zustand | The scenario store | https://zustand.docs.pmnd.rs/ |
| zod | Checking form input | https://zod.dev/ |
| openapi-typescript | Generating types from the contract | https://openapi-ts.dev/ |
| Vitest, Testing Library, pytest, ruff, ESLint, Prettier | Tests and code checks | |

To confirm before submission: the licence of each library, and that each is free to use in an open-source project.

## Design references

- Prompt Motion, a library of motion design examples with source code. Used as a reference for the landing page scenes and the demo video. https://www.promptsmotion.com

## Images and textures

Listed with their owners and credit lines in [data/sources.md](../data/sources.md). Add any new image here and there.

## How to cite a new source

Give the owner, the title, the address, and the date you accessed it if the page may change. For data, also give the file names used.
