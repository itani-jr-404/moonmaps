# Sites

Status: Design. Last updated: 2026-11-14.

The curated site list is one file, `apps/api/app/data/sites.json`. The API serves it at `GET /sites`. It is the only place site coordinates are defined.

## Fields

| Field | Type | Rule |
| --- | --- | --- |
| `id` | string | Lower case, hyphens, unique, never changed once published (it appears in URLs) |
| `name` | string | As the mission or the IAU names it |
| `lat` | number | Degrees, -90 to 90 |
| `lon` | number | Degrees, east-positive, -180 to 180 |
| `kind` | string | `apollo`, `clps`, `artemis-candidate`, `international`, `reference` |
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
  "description": "First crewed landing on the Moon, July 1969.",
  "source_url": "https://...",
  "mission_date": "1969-07-20"
}
```

## Rules for adding a site

1. Coordinates come from a source that can be linked: a NASA or agency page, the LROC site, or a published paper. Not from memory, and not from a general encyclopedia if a primary source exists.
2. Longitude is converted to east-positive, -180 to 180. Many sources give 0 to 360 or use W. Write the conversion in the pull request.
3. Open the coordinates in Quickmap and check that the point is where the name says it is.
4. For a region (an Artemis candidate region is an area, not a point), choose one representative point, say so in the description, and prefer the point a published study uses.
5. A site with no terrain grid available still goes in; the app will say the horizon is a smooth Moon.

## What the list should contain

The challenge asks for "past Apollo missions, future CLPS mission targets, targets of other commercial lunar missions, or landing sites from other countries' lunar programs". Target: 12 to 20 sites.

| Kind | Examples to include |
| --- | --- |
| `artemis-candidate` | The named south pole regions NASA has published as candidates, such as Malapert massif, de Gerlache rim, Nobile rim, the ridge between Shackleton and de Gerlache, Haworth, Amundsen rim |
| `clps` | South pole CLPS landing sites and targets |
| `international` | South pole or high-latitude landings by other countries, such as India's Chandrayaan-3 |
| `apollo` | Two or three Apollo sites, for contrast: the Sun gets high there and the Earth stays put |
| `reference` | A point very close to the pole, used by the accuracy page |

NASA Goddard's 5 m site models (https://pgda.gsfc.nasa.gov/products/78) give named south pole sites with their locations, and are a good primary source for the polar entries.

## Starter values, to confirm

These are from memory and must be checked against a primary source before they go into `sites.json`.

| Site | Latitude | Longitude | Note |
| --- | --- | --- | --- |
| Apollo 11 | 0.674 | 23.473 | LRO-derived position |
| Apollo 15 | 26.132 | 3.634 | |
| Apollo 17 | 20.191 | 30.772 | |
| Chandrayaan-3 | -69.37 | 32.32 | Landed August 2023 |
| Shackleton crater, centre | -89.67 | 129.78 | The crater floor is permanently dark; the rim is the candidate area |

## Generated outputs

- `scripts/precompute_horizons.py` reads `sites.json` and builds the horizon profile of every site.
- The assistant's `knowledge/sites.md` is generated from `sites.json`, so the assistant and the app never disagree about a site.
