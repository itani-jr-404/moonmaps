# ADR-015: The global LOLA grid at 16 pixels per degree gives every other site a terrain horizon

Status: Accepted. Date: 2026-11-15.

## Context

The horizon came only from the two LOLA south polar grids (`LDEM_80S_80M`, `LDEM_75S_120M`). Every site north of 75 S, including the three Apollo sites, SLIM, both Chang'e sites and Chandrayaan-3, used a smooth Moon with a flat horizon. The team's test notes asked for terrain everywhere, and for a picture of the elevation around a site. The challenge asks for LOLA topography for realistic surfaces and accurate horizons ([product/challenge-coverage.md](../product/challenge-coverage.md)).

The LOLA team publishes global grids in simple cylindrical projection at https://imbrium.mit.edu/DATA/LOLA_GDR/CYLINDRICAL/IMG/ (directory listing read 2026-11-15). The single-file grids, with the sizes the listing gives and the pixel sizes their labels give (`MAP_SCALE`, at the equator):

| File | Pixels per degree | Pixel at the equator | Size |
| --- | --- | --- | --- |
| `LDEM_4.IMG` | 4 | 7580.84 m | 2,073,600 bytes |
| `LDEM_16.IMG` | 16 | 1895.21 m | 33,177,600 bytes |
| `LDEM_64.IMG` | 64 | 473.802 m | 530,841,600 bytes |
| `LDEM_128.IMG` | 128 | 236.901 m | 2,123,366,400 bytes |

The grids at 256 and 512 pixels per degree are split into 4 and 16 tiles in the same folder. The API image is built from `apps/api/Dockerfile`, which downloads the data at build time; the two polar grids already add about 232 MB.

## Decision

The API loads `LDEM_16` after the two polar grids. The grids are still tried finest first, so the polar grids give the same horizon as before wherever they cover a point, and the global grid covers everything else, including the samples of a horizon walk that leave the polar grids. `horizon.source` is `lola-global-16ppd` for a site that only the global grid covers. The smooth Moon (`sphere`) remains only for the case where no grid is loaded.

## Consequences

- Every site gets a terrain horizon. Measured on 2026-11-15 with `scripts/precompute_horizons.py`: the highest point of the horizon is 0.92 degrees at Apollo 11, 12.43 at Apollo 15 and 11.74 at Apollo 17, against 0 on the smooth Moon. The ten curated sites south of 80 S have exactly the same profiles as before.
- The download grows by 33 MB, not 531 MB, and the end-to-end tests in CI can use the real grid.
- A global pixel is about 1.9 km wide at the equator. Hills and crater rims smaller than a few kilometres are smoothed, so horizons close to a site can be too low. A site's height is also an average over that area. The polar grids are 24 and 16 times finer.
- The same grids serve `GET /terrain`, the elevation map on the site page.
- The horizon cache file names now include a short tag of the loaded grids, so a profile saved with other grids (for example an old smooth-Moon file) is never reused.

## Alternatives considered

- **`LDEM_64` (474 m).** Four times finer, but 531 MB, more than twice the two polar grids together and more than the few hundred MB we allow for the data in the image. It can replace `LDEM_16` later by changing the file name in `download_data.py` and `container.py`; the reader takes every layout value from the label.
- **`LDEM_4` (7.58 km).** Smaller, but too coarse to show most crater rims.
- **Keeping the smooth Moon outside the poles.** Simple, but it ignores terrain the challenge asks for, which the team's test notes reported as a problem.
