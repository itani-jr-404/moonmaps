# Testing

Status: Design. Last updated: 2026-11-14.

What we test, where, and what must pass before a change is merged. The reasoning behind the science checks is in [science/validation.md](../science/validation.md).

## The rule

Everyone writes at least one test for the code they add. Calculations are also checked against JPL Horizons, by someone other than the author where possible.

## API tests (pytest)

| File | Tests | Needs data files |
| --- | --- | --- |
| `tests/test_geometry.py` | Great-circle destination formula against hand-worked cases; the elevation-angle formula (a point at the same height at distance 0 is at 0 degrees; a tall point nearby is high; a point at the same height far away is negative) | No |
| `tests/test_projection.py` | Latitude and longitude to pixel and back gives the same point; the pole maps to the grid centre | No |
| `tests/test_horizon.py` | On a flat synthetic grid the profile is zero everywhere; with one synthetic mountain to the east the profile peaks at azimuth 90 with the expected angle | No |
| `tests/test_visibility.py` | Clearance and visibility on small arrays; windows with interpolated edges; open windows at both ends of the range | No |
| `tests/test_metrics.py` | Each metric on a synthetic series whose answer is known; the all-light and all-dark cases | No |
| `tests/test_status.py` | Thresholds give the expected badge at and around each boundary | No |
| `tests/test_horizons.py` | Our Sun and Earth angles against the saved JPL Horizons values, within 0.05 degrees | Kernels |
| `tests/test_api.py` | Each endpoint returns its model; every limit returns its error code | Kernels; uses a small synthetic grid |
| `tests/test_assistant.py` | With a fake model: a glossary question is answered without tools; a numeric question triggers the `analyze` tool; the tool-round limit holds; an unconfigured model returns `assistant_unavailable` | No |

Tests that need the downloaded kernels are marked and skipped with a clear message when the files are missing, so the pure tests always run.

Synthetic grids are built in the tests (a flat plane, a plane with one cone), so most tests are fast and independent of NASA files.

## Web tests (Vitest and Testing Library)

| Area | Tests |
| --- | --- |
| `lib/format` | Angles, durations and dates format as expected, with units |
| `lib/state` | A scenario round-trips through the URL; a bad URL falls back safely |
| `features/panorama` | The path builder turns a profile and a series into the expected SVG points; hidden segments are marked |
| `features/metrics` | Tiles show the API's values; the countdown follows the current time |
| `features/time` | The sampler interpolates between two samples and clamps at the ends |
| `features/sites` | The coordinate form accepts valid input and refuses invalid input with a message |
| Design tokens | The colour pairs we rely on meet the contrast ratio |

3D scenes are not unit tested. Their math helpers (latitude and longitude to a point on the sphere, azimuth and elevation to a direction) are.

## Contract check

CI exports the OpenAPI file from the API and regenerates the TypeScript types. If either differs from what is committed, the build fails. This catches a model change that was not followed through.

## What runs when

| When | What |
| --- | --- |
| On commit | Format and lint of staged files |
| On every push and pull request | Lint, type check and tests for both sides; the contract check |
| Before a demo or submission | The checklist below, by hand |

## Manual checklist before a demo

1. Open a curated south pole site for a 30 day range. The panorama, timeline and metrics agree with each other.
2. Drag the slider across a sunset. The marker passes behind the terrain, the timeline bar ends, the countdown reaches zero, and the 3D scene goes dark, all at the same moment.
3. Enter custom coordinates. A result appears.
4. Compare two sites, and one site at two dates.
5. Open the accuracy page. Every case passes.
6. Ask the assistant a glossary question and a "which site" question. Check that the numbers in its answer match the screen.
7. Turn on reduced motion and reload the landing page.
8. Open the app in a private window on a phone.
9. Stop the API and reload a curated site. The fallback result and its notice appear.

## When a test fails

Fix the code or fix the test, and say which in the pull request. Do not loosen the Horizons tolerance to make a failure go away; a difference above 0.05 degrees means a real error in frames, time or coordinates.
