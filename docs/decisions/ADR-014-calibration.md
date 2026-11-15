# ADR-014: Learning from past data with a small calibration model

Status: Accepted. Last updated: 2026-11-15.

## Context

The judges asked us to compare the app with previous landings and data to narrow the error range, and the team wanted a small machine learning system that learns from that data and shows the error rate. We have two kinds of saved reference data: Sun elevations at 16 Apollo moonwalk times checked against NASA JPL Horizons (`apollo_sun.json`), and our long-term sunlight and Earth-visibility shares at 300 random south pole points next to NASA Goddard's PGDA maps (`pgda_comparison.json`; Mazarico et al. 2011, doi:10.1016/j.icarus.2010.10.030, https://pgda.gsfc.nasa.gov/products/69). The Apollo values already agree with JPL Horizons to under 0.0005 degrees, so there is nothing to learn there. The PGDA comparison has a measurable gap, mostly because the app counts a body as visible when the centre of its disc is up (ADR-005) while the maps count any part of the disc.

## Decision

`apps/api/scripts/train_calibration.py` fits, for the Sun and for the Earth, a ridge regression (Hoerl and Kennard 1970, doi:10.1080/00401706.1970.10488634) that predicts NASA's value from our centre-of-disc share, our any-part share, the absolute latitude, and the product of the first and third. It uses numpy only. The penalty (1.0 on standardised features) was fixed before the run. The error is measured with 10 repeats of 5-fold cross-validation (seed 20261115), so every reported error is on points the model did not see. The result, with the final model fitted on all 300 points, is saved in `apps/api/app/data/validation/calibration.json` and served by `GET /accuracy`.

The calibration is reported, not applied to what the planner shows. `app/services/accuracy.py` has a helper (`apply_calibration`) for long-term shares over the 18.6-year cycle, the quantity it was trained on. It must not be applied to a 30-day result, which is a different quantity.

## Consequences

- The error rate shown in the app is measured, reproducible and every number comes from a saved file.
- The result is honest about its size: on held-out points the model lowers the mean error of the app's centre-of-disc rule (Sun 0.0132 to 0.0079, Earth 0.0362 to 0.0103), but simply counting any part of the disc, with no learning, does better still (0.0063 and 0.0061). The learned model mostly rediscovers that physical rule. See [VALIDATION.md](../VALIDATION.md#12-learning-from-past-data).
- The 300 points are all between 80.5 S and 89.5 S, so the calibration says nothing about other latitudes.
- If `pgda_comparison.json` is regenerated, the script must be run again.

## Alternatives considered

- **A larger model (gradient boosting, a neural network).** 300 points and four features do not support it, and it would add heavy dependencies.
- **Applying the calibration to every result.** Rejected: the model was trained on 18.6-year shares, and nothing shows it holds for a 30-day window.
- **Learning from the Apollo Sun angles.** There is no error to learn: our values equal JPL Horizons, and the gap to the journal table lies in the table (VALIDATION.md Section 3).
- **Switching the app to the any-part rule.** It matches NASA's maps better, but it is a separate design change to ADR-005 that the team has not agreed.
