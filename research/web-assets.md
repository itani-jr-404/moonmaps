# Web app assets: textures and 3D models

Last updated: 2026-11-14.

These are the NASA files the web app loads from `apps/web/public/`. Each one was downloaded with `curl -L` from the address below, then checked with `file`, `sips` (for image size) and `shasum -a 256`. All pages were read on 2026-11-14.

## Assets

| File | Size | Type, as checked | Source page | Direct download | Owner, as named on the page | Usage terms | Credit line | Read on |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `apps/web/public/textures/lroc_color_2k.jpg` | 0.46 MB (457,942 bytes) | JPEG, 2048 x 1024, RGB, 8-bit | https://svs.gsfc.nasa.gov/4720 ("CGI Moon Kit", ID 4720, last updated 9 January 2026) | https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_2k.jpg | NASA's Scientific Visualization Studio; visualizer Ernie Wright (STC), scientist Noah Petro (NASA/GSFC). Data: LROC WAC Color Mosaic, collected by Arizona State University | SVS (1) and NASA media guidelines (2), quoted below | "NASA's Scientific Visualization Studio" | 2026-11-14 |
| `apps/web/public/textures/ldem_3_8bit.jpg` | 0.11 MB (111,552 bytes) | JPEG, 1024 x 512, 1 channel (greyscale), 8-bit | https://svs.gsfc.nasa.gov/4720 | https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_3_8bit.jpg | Same as above. Data: LRO LOLA DEM | Same as above | "NASA's Scientific Visualization Studio" | 2026-11-14 |
| `apps/web/public/models/Z2Spacesuit.glb` | **16.93 MB (16,933,148 bytes; the page shows 16.15 MB, which is the same size in MiB). Over the 15 MB limit.** | glTF binary, version 2 | https://science.nasa.gov/3d-resources/z2-spacesuit/ | https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/z2-spacesuit/Z2%20Spacesuit.glb | Source: "NASA/LaRC/Advanced Concepts Lab" | 3D Resources (3) and NASA media guidelines (2) | No credit line on the page. Suggested: "NASA/LaRC/Advanced Concepts Lab, via NASA 3D Resources" (our wording, to confirm) | 2026-11-14 |
| `apps/web/public/models/LunarModule.glb` | 0.72 MB (716,840 bytes) | glTF binary, version 2 | https://science.nasa.gov/3d-resources/apollo-lunar-module/ | https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/apollo-lunar-module/Apollo%20Lunar%20Module.glb | Source: "NASA/Michael D. Carbajal" | (3) and (2) | No credit line on the page. Suggested: "NASA/Michael D. Carbajal, via NASA 3D Resources" (our wording, to confirm) | 2026-11-14 |
| `apps/web/public/models/Astronaut.glb` (optional fallback) | 0.76 MB (762,988 bytes) | glTF binary, version 2 | https://science.nasa.gov/3d-resources/astronaut/ | https://assets.science.nasa.gov/content/dam/science/cds/3d/resources/model/astronaut/Astronaut.glb | Source: "DigitalSpace Corporation" (a company, not NASA; listed as a contributor in the NASA 3D Resources README) | (3) and (2). The page marks no copyright, but the named source is not NASA, so this is to confirm before wide use | No credit line on the page. Suggested: "DigitalSpace Corporation, via NASA 3D Resources" (our wording, to confirm) | 2026-11-14 |

The three models are also in the GitHub mirror https://github.com/nasa/NASA-3D-Resources (branch `master`, folder `3D Models/`, files `Z2 Spacesuit/Z2 Spacesuit.glb`, `Apollo Lunar Module/Apollo Lunar Module.glb`, `Astronaut/Astronaut.glb`). The mirror copies and the science.nasa.gov copies have the same SHA-256, so they are the same files. The repository has no licence file.

## SHA-256 of the saved files

| File | SHA-256 |
| --- | --- |
| `lroc_color_2k.jpg` | `f7130a1822681fa7512d7dcfd40db8c10b9ba4f06777910348698260ed7a2170` |
| `ldem_3_8bit.jpg` | `6d93f887e7d8bedfe35ab89ba785e5e3ca12381bd092a5e6abe2c707dda8bb98` |
| `Z2Spacesuit.glb` | `4199762c27f8e730030a7bf9f1a453c203457e84c33b36247c0237a74f9a0c2a` |
| `LunarModule.glb` | `379101dfcee399267addf771709107c35e826b0b9e5233272f123e4c8a585c4e` |
| `Astronaut.glb` | `d18c141410542b935113d1c25a9271d90c40d44015a64295b7b68a30f0ce2820` |

## Usage terms, quoted

1. SVS help page, https://svs.gsfc.nasa.gov/help/ , read 2026-11-14: "All of our content is in the public domain (unless otherwise noted), meaning that it is free to download, use, and redistribute for whatever purposes you see fit." The CGI Moon Kit page says: "Please give credit for this item to: NASA's Scientific Visualization Studio".
2. NASA Images and Media Usage Guidelines, https://www.nasa.gov/nasa-brand-center/images-and-media/ , read 2026-11-14: "NASA content – images, audio, video, and media files used in the rendition of 3-dimensional models, such as texture maps and polygon data in any format – generally are not subject to copyright in the United States. You may use this material for educational or informational purposes, including photo collections, textbooks, public exhibits, computer graphical simulations and Internet Web pages." And: "NASA should be acknowledged as the source of the material." And: "If the NASA material is to be used for commercial purposes, including advertisements, it must not explicitly or implicitly convey NASA's endorsement of commercial goods or services."
3. NASA 3D Resources catalog, https://science.nasa.gov/3d-resources/ , read 2026-11-14: "All of these assets are free to download and use." The GitHub README, https://github.com/nasa/NASA-3D-Resources , read 2026-11-14: "These assets are free and without copyright."

## Notes on the files

- `lroc_color_2k.jpg` is listed on the SVS page in the "Color" section next to the 2025 colour map files. The page describes the 2025 map as produced in December 2025, and the 2019 map as the older version. The JPEG metadata names a 27360 x 13680 source TIFF. No conversion was needed.
- `ldem_3_8bit.jpg` exists in the kit under the exact name. It is 1024 x 512, which is about 2.84 pixels per degree, not exactly 3. The SVS page describes only the 4, 16 and 64 pixels-per-degree TIFFs in words; it does not state how the 8-bit grey values map to height in kilometres. The height scale of this file is to confirm (for real heights, use `ldem_4.tif` or `ldem_16.tif`, whose units the page does state).
- `Z2Spacesuit.glb` was 16.93 MB as downloaded. The copy in the repository is compressed with glTF-Transform 4.5.1 (https://gltf-transform.dev/, MIT licence): `gltf-transform optimize Z2Spacesuit.glb Z2.glb --compress meshopt --texture-compress webp --texture-size 2048`, which gives 0.80 MB. The web app decodes it with three.js's Meshopt decoder. The SHA-256 above is of the original download.
- The pages give no credit line for the three models. The NASA guidelines ask that NASA be acknowledged as the source.
