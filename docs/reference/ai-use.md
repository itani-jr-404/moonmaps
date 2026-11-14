# Use of AI

Last updated: 2026-11-14.

The Space Apps rules ask teams to say whether and how AI tools were used, to mark AI-made images and video with a visible watermark, and to disclose AI-made code, data and audio. This file is the project's record. Keep it accurate; it is the source for the "Use of Super Intelligence" answer in the submission.

## AI inside the product

| Where | What it does | What it does not do |
| --- | --- | --- |
| The assistant (chat panel) | Explains results and terms; runs calculations through the app's own API and reports them | Compute any number itself; influence the results shown elsewhere in the app |

The assistant is labelled as an AI assistant in the interface and shows its sources. The model behind it is recorded here once chosen:

- Provider and model: (to be filled in)

No other part of the product uses AI. Positions, horizons, visibility and metrics are deterministic calculations from NASA data.

## AI used to build the project

| Date | Area | Tool | How it was used | Who reviewed it |
| --- | --- | --- | --- | --- |
| 2026-11-14 | API code (`apps/api`) and its tests | Claude, an AI coding assistant made by Anthropic | Wrote the API (endpoints, ephemeris, terrain and horizon engines, visibility, scripts) and its tests from the team's design documents | The team lead |
| 2026-11-14 | Web app (`apps/web`) | Claude | Ported the team's prototype into the Next.js app, following the team's design | The team lead |
| 2026-11-14 | Documentation | Claude | Updated these documents to match the code, from the code and the sources listed in [references.md](references.md) | The team lead |

How the output was checked:

- The Sun and Earth angles are compared with JPL Horizons by an automated test (`apps/api/tests/test_horizons.py`): 16 cases, all within 0.05 degrees. See [science/validation.md](../science/validation.md).
- The LOLA grid reading is checked by a test against a known crater (Shackleton) on the real grid.
- Items the tool could not confirm against a source are marked "to confirm" in the documents.
- AI-written code and text can still contain mistakes that the tests do not catch.

Rules we follow:

- Nobody merges generated code they have not read and run. Everyone writes at least one test for their own area.
- The calculations are checked against JPL Horizons, an independent NASA source.
- The idea, the feature choices and the design decisions are the team's.

## AI-made images, video and audio

Every such file is listed here and carries a visible watermark.

| File | Tool | Watermarked |
| --- | --- | --- |
| (none yet) | | |

AI-made content never uses or alters NASA logos, flags or mission insignia.

## Where this is disclosed

- This file.
- The About page of the app.
- The "Use of Super Intelligence" field of the submission.
- A short section in the repository's README.
