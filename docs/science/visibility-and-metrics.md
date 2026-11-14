# Visibility and metrics

Status: Design. Last updated: 2026-11-14.

How positions and the horizon profile become "visible or not", windows, metrics and a status.

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

`clearance` is returned in the response, so the interface can also show "partly hidden" when `|clearance|` is smaller than the body's angular radius (about 0.27 degrees for the Sun, 0.95 for the Earth).

## Windows

A window is a continuous period during which a body is visible.

1. Find where `visible` changes between one sample and the next.
2. Place the change time by linear interpolation of `clearance` between the two samples, so a one hour step still gives times good to a few minutes.
3. A window that is already open at `start` begins at `start`; one still open at `end` ends at `end`.

Three lists are returned: `sun`, `earth`, and `both` (the overlap).

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
| `longest_dark_hours` | Longest gap between Sun windows, in hours |
| `longest_comm_gap_hours` | Longest gap between Earth windows, in hours |
| `max_sun_elevation` | Highest elevation of the Sun in the range, in degrees |
| `sun_elevation_at_start` | Elevation of the Sun at `start` |

"Time left before sunset" in the interface is `next_sunset` minus the slider's current time, computed in the browser from the windows.

### A note on power

Landers at the poles carry solar panels that stand upright and turn toward the Sun, because the Sun is always near the horizon. For such a panel, the power available depends mostly on whether the Sun is visible, not on how high it is. So `sunlight_fraction` is our main power measure. `max_sun_elevation` is shown next to it because it matters for panels that lie flat and for how warm the ground gets.

## Status: go, caution, no-go

Each scenario gets a status for power and one for communication. The thresholds below are starting values. They live in one place (`engines/visibility.py`, `STATUS_THRESHOLDS`) and the team tunes them once real results are on screen.

| Status | Power | Communication |
| --- | --- | --- |
| go | `sunlight_fraction` at least 0.70 and `longest_dark_hours` at most 48 | `earth_visible_fraction` at least 0.50 and `longest_comm_gap_hours` at most 72 |
| caution | Neither go nor no-go | Neither go nor no-go |
| no-go | `sunlight_fraction` below 0.30, or `longest_dark_hours` above 168 | `earth_visible_fraction` below 0.10 |

The interface always shows the numbers next to the badge, and a tooltip states the rule. A badge is a summary, not a verdict on a real mission.

## Worked example (to replace with real output)

When the engine runs, put one real scenario here: site, range, a few lines of the series, the windows, and the metrics computed by hand from them. It doubles as a test case.

## Edge cases

| Case | Behaviour |
| --- | --- |
| Sun up for the whole range | One window from `start` to `end`; `next_sunset` is `null`; `longest_dark_hours` is 0 |
| Sun down for the whole range | No windows; fractions are 0; `longest_dark_hours` is the length of the range |
| Body skims the horizon and flickers between samples | Windows shorter than one step can be missed. Use a smaller step for a short range |
| No terrain data for the site | The profile is all zeros (smooth Moon) and `horizon.source` is `sphere`; the interface warns that terrain is not included |
