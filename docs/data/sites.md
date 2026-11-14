# Sites

Status: Built. Last updated: 2026-11-14.

The curated site list is one file, `apps/api/app/data/sites.json`. The API serves it at `GET /sites`. It is the only place site coordinates are defined.

## Fields

| Field | Type | Rule |
| --- | --- | --- |
| `id` | string | Lower case, hyphens, unique, never changed once published (it appears in URLs) |
| `name` | string | As the mission or the IAU names it |
| `lat` | number | Degrees, -90 to 90 |
| `lon` | number | Degrees, east-positive, -180 to 180 |
| `kind` | string | `apollo`, `clps`, `artemis-candidate`, `international`, `reference`. The API also uses `custom` for a point given by coordinates; it never appears in the file |
| `description` | string | One or two plain sentences: what it is and why it matters |
| `source_url` | string | Where the coordinates came from |
| `mission_date` | string, optional | Landing date for past missions |

```json
{
  "id": "apollo-11",
  "name": "Apollo 11, Tranquility Base",
  "lat": 0.67416,
  "lon": 23.47314,
  "kind": "apollo",
  "description": "...",
  "source_url": "https://lroc.im-ldi.com/images/938",
  "mission_date": "1969-07-20"
}
```

## Rules for adding a site

1. Coordinates come from a source that can be linked: a NASA or agency page, the LROC site, or a published paper. Not from memory, and not from a general encyclopedia if a primary source exists.
2. Longitude is converted to east-positive, -180 to 180. Many sources give 0 to 360 or use W. Write the conversion in the pull request.
3. Open the coordinates in Quickmap and check that the point is where the name says it is.
4. For a region (an Artemis candidate region is an area, not a point), choose one representative point, say so in the description, and prefer the point a published study uses.
5. A site with no terrain grid available still goes in; the app will say the horizon is a smooth Moon.

## The list today

17 sites, in `apps/api/app/data/sites.json`. The source of every coordinate, the title and owner of the page, the date it was read and any conversion are in [research/site-coordinates.md](../../research/site-coordinates.md).

| id | Name | Latitude | Longitude | Kind |
| --- | --- | --- | --- | --- |
| `shackleton-ridge` | Shackleton–de Gerlache connecting ridge | -89.684 | -163.261 | artemis-candidate |
| `malapert-massif` | Malapert Massif | -86.0 | 0.0 | artemis-candidate |
| `haworth` | Haworth | -86.8 | -22.0 | artemis-candidate |
| `mons-mouton` | Mons Mouton | -84.6 | 31.0 | artemis-candidate |
| `nobile-rim-2` | Nobile Rim 2 | -84.20156 | 60.69989 | artemis-candidate |
| `de-gerlache-rim-2` | de Gerlache Rim 2 | -88.51566 | -61.16732 | artemis-candidate |
| `amundsen-rim` | Amundsen Rim | -84.19184 | 67.22904 | artemis-candidate |
| `cabeus-lcross` | Cabeus, LCROSS Centaur impact point | -84.6796 | -48.7093 | reference |
| `south-pole-reference` | Near south pole reference point | -89.9 | 0.0 | reference |
| `im-2` | IM-2 Athena, Mons Mouton | -84.7906 | 29.1957 | clps |
| `chandrayaan-3` | Chandrayaan-3 Vikram lander | -69.3741 | 32.32 | international |
| `apollo-11` | Apollo 11, Tranquility Base | 0.67416 | 23.47314 | apollo |
| `apollo-15` | Apollo 15, Hadley-Apennine | 26.13239 | 3.6333 | apollo |
| `apollo-17` | Apollo 17, Taurus-Littrow | 20.1911 | 30.7723 | apollo |
| `slim` | SLIM, near Shioli crater | -13.316 | 25.251 | international |
| `change-4` | Chang'e 4, Von Kármán crater | -45.457 | 177.589 | international |
| `change-6` | Chang'e 6, Apollo basin | -41.6385 | -153.9852 | international |

The 10 sites south of 80 S have a terrain horizon from the 80 m LOLA grid (`lola-80s-80m`). The other 7 (Chandrayaan-3, the three Apollo sites, SLIM and both Chang'e sites) are north of 75 S and use a smooth Moon (`sphere`); see [science/terrain-and-horizon.md](../science/terrain-and-horizon.md).

Still to confirm:

- None of the points has been opened in Quickmap yet (step 3 of the rules above).
- The de Gerlache Rim 2 longitude is read as west from a letter "O" in the source table.
- Nobile Rim 2, de Gerlache Rim 2 and Amundsen Rim are the best-ranked points of one published study, not points NASA chose.
- `cabeus-lcross` is filed as `reference` because no kind fits an impact point.
- Whether the landing dates of some international and CLPS sites are UTC dates.

The details of each doubt are in [research/site-coordinates.md](../../research/site-coordinates.md).

## Shackleton crater test point

`apps/api/tests/test_lola_grid.py` uses 89.67 S, 129.78 E as the position of Shackleton crater, to check that the projection is not mirrored. That value was written from memory and its source is to confirm. The test does not depend on its exact value: it only needs a point inside the crater.

## Generated outputs

- `apps/api/scripts/precompute_horizons.py` reads `sites.json` and builds the horizon profile of every site.
- Planned: the assistant's `knowledge/sites.md`, generated from `sites.json`, so the assistant and the app never disagree about a site.
