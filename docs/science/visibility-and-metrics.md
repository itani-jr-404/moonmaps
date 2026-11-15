# Visibility and metrics

Status: Built. Last updated: 2026-11-15.

How positions and the horizon profile become "visible or not", windows, metrics and a status. The code is `apps/api/app/engines/visibility.py`.

## The rule

The Moon has no atmosphere, so light is not bent near the horizon. A body is visible from a site when it is higher in the sky than the terrain in its direction.

For each time step and each body (Sun, Earth):

```text
clearance = elevation - horizon(azimuth)
visible   = clearance > 0
```

`horizon(azimuth)` is the profile from [terrain-and-horizon.md](terrain-and-horizon.md), interpolated at the body's azimuth.

### Disc size

The Sun and the Earth are discs, not points. The rule above uses the centre of the disc. So:

- the Sun counts as visible when at least half of its disc is above the terrain;
- the Earth counts as visible when its centre is above the terrain.

This is the cautious choice for the Earth, since a radio link wants a clear line, not a sliver. NASA's long-term maps count the Earth as visible when any part of the disc shows, so our Earth percentage will be a little lower than theirs.

`clearance` is returned in the response, so the interface could also show "partly hidden" when `|clearance|` is smaller than the body's angular radius (about 0.27 degrees for the Sun, 0.95 for the Earth; source to confirm, see [conventions-and-ephemeris.md](conventions-and-ephemeris.md)). The web app does not do this yet.

## Windows

A window is a continuous period during which a body is visible.

1. Find where `visible` changes between one sample and the next.
2. Place the change time by linear interpolation of `clearance` between the two samples, so a one hour step still gives times good to a few minutes.
3. A window that is already open at `start` begins at `start`; one still open at `end` ends at `end`.

Three lists are returned: `sun`, `earth`, and `both` (the overlap of the first two).

The response also has `at_start`: whether each body is visible at the first sample, and its clearance there.

## Metrics

All are computed over the scenario's range.

| Metric | Definition |
| --- | --- |
| `sunlight_fraction` | Total length of Sun windows divided by the length of the range |
| `earth_visible_fraction` | Same for the Earth |
| `both_fraction` | Same for the overlap |
| `next_sunset` | End of the Sun window that contains `start`, if that end is before `end`. `null` if the Sun is down at `start` or does not set in the range |
| `next_sunrise` | Start of the first Sun window after `start`. `null` if the Sun is up at `start` or never rises in the range |
| `next_earthset`, `next_earthrise` | Same for the Earth |
| `longest_dark_hours` | Longest time without the Sun inside the range, in hours: the gaps between Sun windows, and also the time before the first window and after the last |
| `longest_comm_gap_hours` | Same for the Earth |
| `max_sun_elevation` | Highest elevation of the Sun in the range, in degrees |
| `sun_elevation_at_start` | Elevation of the Sun at `start` |

Fractions are rounded to 5 decimals, hours to 3, elevations to 4.

### A note on power

Landers at the poles carry solar panels that stand upright and turn toward the Sun, because the Sun is always near the horizon. For such a panel, the power available depends mostly on whether the Sun is visible, not on how high it is. So `sunlight_fraction` is our main power measure. `max_sun_elevation` is shown next to it because it matters for panels that lie flat and for how warm the ground gets.

## Status: go, caution, no-go

Each scenario gets a status for power and one for communication. The thresholds below are starting values chosen by the team, not taken from a mission standard. They live in one place (`engines/visibility.py`, `STATUS_THRESHOLDS`) and the team tunes them once real results are on screen.

| Status | Power | Communication |
| --- | --- | --- |
| go | `sunlight_fraction` at least 0.70 and `longest_dark_hours` at most 48 | `earth_visible_fraction` at least 0.50 and `longest_comm_gap_hours` at most 72 |
| caution | Neither go nor no-go | Neither go nor no-go |
| no-go | `sunlight_fraction` below 0.30, or `longest_dark_hours` above 168 | `earth_visible_fraction` below 0.10 |

The interface always shows the numbers next to the badge, and a tooltip states the rule. A badge is a summary, not a verdict on a real mission.

## Worked example

A real result, computed on 2026-11-14 by running the API code directly:

```python
# cd apps/api && uv run python   (with the data downloaded)
from datetime import UTC, datetime, timedelta
from app.core.config import get_settings
from app.services.container import build_services
from app.schemas.analyze import Scenario
from app.schemas.common import SiteById

services = build_services(get_settings())
start = datetime(2026, 11, 14, 14, 56, tzinfo=UTC)
r = services.analysis.run_one(Scenario(
    site=SiteById(id="shackleton-ridge"), start=start, end=start + timedelta(days=35),
    step_minutes=30, include_series=False))
```

Site: `shackleton-ridge`, 89.684 S, 163.261 W ([data/sites.md](../data/sites.md)). Range: 2026-11-14 14:56 UTC to 2026-12-19 14:56 UTC (35 days, 840 hours), step 30 minutes.

Output:

| Item | Value |
| --- | --- |
| `horizon.source`, `horizon.site_height_m` | `lola-80s-80m`, 1724.5 m |
| `at_start` | `sun_visible` true, `earth_visible` false, `sun_clearance` 3.0167, `earth_clearance` -4.2988 |
| `windows.both[0]` | 2026-11-17 19:16:03 to 2026-11-30 10:47:26 UTC |
| `windows.both[1]` | 2026-12-14 21:03:46 to 2026-12-19 14:56:00 UTC |
| `metrics.sunlight_fraction` | 1.0 |
| `metrics.earth_visible_fraction`, `both_fraction` | 0.4969, 0.4969 |
| `metrics.next_earthrise` | 2026-11-17 19:16:03 UTC |
| `metrics.next_sunset`, `next_sunrise`, `next_earthset` | null, null, null |
| `metrics.longest_dark_hours` | 0.0 |
| `metrics.longest_comm_gap_hours` | 346.272 |
| `metrics.max_sun_elevation`, `sun_elevation_at_start` | 1.7602, 1.6239 degrees |
| `status` | power `go`, comm `caution` |

Checking it by hand:

- The Sun is visible for the whole range, so there is one Sun window from `start` to `end`, the fraction is 1.0, and there is no sunset or sunrise.
- The Sun's elevation at the start is 1.6239 degrees, but its clearance is 3.0167 degrees: the site is on a ridge 1724.5 m up, so the terrain horizon in the Sun's direction is below the horizontal (about -1.39 degrees).
- Because the Sun is always up, the `both` windows are the Earth windows. They last 303.52 hours and 113.87 hours, 417.39 hours in all; 417.39 / 840 = 0.4969.
- The Earth is hidden at the start, so `next_earthrise` is the start of the first window and `next_earthset` is null.
- The longest time without the Earth is between the two windows: 2026-11-30 10:47:26 to 2026-12-14 21:03:46, 346.272 hours.
- Power is `go` (fraction at least 0.70, no dark period). Communication is `caution`: the fraction is below 0.50, but above 0.10.

## Edge cases

| Case | Behaviour |
| --- | --- |
| Sun up for the whole range | One window from `start` to `end`; `next_sunset` is `null`; `longest_dark_hours` is 0 |
| Sun down for the whole range | No windows; fractions are 0; `longest_dark_hours` is the length of the range |
| Body skims the horizon and flickers between samples | Windows shorter than one step can be missed. Use a smaller step for a short range |
| No elevation grid loaded (the global grid covers every site once it is downloaded) | The profile is all zeros (smooth Moon), `horizon.source` is `sphere` and `horizon.site_height_m` is null |
