# Use of AI

Last updated: 2026-11-15.

The Space Apps rules ask teams to say whether and how AI tools were used, to mark AI-made images and video with a visible watermark, and to disclose AI-made code, data and audio. This file is the project's record. Keep it accurate; it is the source for the "Use of Super Intelligence" answer in the submission.

## AI inside the product

| Where | What it does | What it does not do |
| --- | --- | --- |
| The assistant (chat panel) | Explains results and terms; runs calculations through the app's own API and reports them | Compute any number itself; influence the results shown elsewhere in the app |

The assistant is labelled as an AI assistant in the interface and shows its sources. The model behind it:

- Provider and model: free models from whichever providers have a key (NVIDIA, Groq, Google Gemini, Cloudflare Workers AI, SambaNova, OpenRouter, Cohere), tried in that order. Each answer reports the provider and model that wrote it. See [ADR-013](../decisions/ADR-013-assistant-model.md).

Positions, horizons, visibility and metrics are deterministic calculations from NASA data. The Accuracy page also shows a small statistical model (ridge regression, `scripts/train_calibration.py`) that learned how our long-term values differ from NASA's maps; it is reported there and not applied to any result. See [ADR-014](../decisions/ADR-014-calibration.md).

## AI used to build the project

| Date | Area | Tool | How it was used | Who reviewed it |
| --- | --- | --- | --- | --- |
| 2026-11-14 | API code (`apps/api`) and its tests | Claude, an AI coding assistant made by Anthropic | Wrote the API (endpoints, ephemeris, terrain and horizon engines, visibility, scripts) and its tests from the team's design documents | The team lead |
| 2026-11-14 | Web app (`apps/web`) | Claude | Ported the team's prototype into the Next.js app, following the team's design | The team lead |
| 2026-11-14 | Documentation | Claude | Updated these documents to match the code, from the code and the sources listed in [references.md](references.md) | The team lead |
| 2026-11-15 | Assistant (`apps/api/app/services/assistant.py` and related files, `apps/web/src/features/assistant`) and its tests | Claude | Wrote the chat endpoint, its guardrails, the chat panel and their tests from [backend/assistant.md](../backend/assistant.md) | The team lead |
| 2026-11-15 | Pages, site page, site assistant, accuracy page, learning from past data (`/accuracy`, `scripts/train_calibration.py`), missions | Claude | Wrote the code, tests and docs from the team's requests and the judges' feedback | The team lead |
| 2026-11-15 | Distance from a site to the Earth's surface, leave-Earth times for the next good window (`GET /missions/departures`), the About page's accuracy sentence | Claude | Wrote the code, tests and docs from the team's test notes; recomputed the JPL Horizons differences by running the validation service | The team lead |
| 2026-11-15 | Assistant knowledge base (`apps/api/app/data/knowledge/`) | Claude | Wrote the files from the app's code, the repository's documents and the official Space Apps and NASA pages listed in each file | The team lead |
| 2026-11-15 | Navy theme, star field, navigation bar, card contrast, why-section drawings and home order (`apps/web/src/app/globals.css`, `site-chrome`, `home`, `why`, planner and about styles) | Claude | Changed the styles from the team's test notes and screenshots, and worked out the contrast ratios; the star field and the Moon ground drawings are CSS and SVG it wrote, not images | The team lead |
| 2026-11-15 | Fixes from the team's test notes: chat resources and welcome, globe point picking and chat context, 3D Sun and Earth drawing, hero render loop, the landed panel on slow frames (`apps/web/src/features/assistant`, `landing`, `hero`) | Claude | Investigated the notes against the code, wrote the fixes, unit tests and document updates | The team lead |
| 2026-11-15 | Terrain everywhere and the elevation map (global LOLA grid reader, `GET /terrain`, the site page's "The ground", ADR-015) | Claude | Wrote the code, tests and docs from the team's test notes; read the LOLA labels and catalogue files it cites | The team lead |
| 2026-11-15 | Leap-second fix in `Ephemeris._times`, its test, and the matching corrections in `docs/VALIDATION.md` and the science documents | Claude | Confirmed the 27 s offset against Skyfield's datetime conversion, wrote the fix and test, recomputed the JPL Horizons table | The team lead |
| 2026-11-15 | Error study (`apps/api/scripts/error_study.py`, `fetch_horizons_wide.py`, `compare_pgda_grids.py`, `app/engines/error_budget.py`, its tests, `research/error-study.md`) | Claude | Wrote the scripts and tests, ran them, and wrote the note from their saved output; every number in the note comes from the JSON files the scripts wrote | The team lead, to review |
| 2026-11-15 | Fixes from the testers' results: the landed view's real skyline (`apps/web/src/features/landing/lib/skyline.ts`, ADR-016) and the team's names in the footer | Claude | Wrote the code, tests and docs from the testers' notes and screenshots | The team lead |
| 2026-11-15 | Assistant answer style in `apps/api/app/services/assistant_prompt.md` (direct first sentence, length and words fitted to the person) | Claude | Rewrote the style rules from the team lead's request | The team lead |
| 2026-11-15 | Documentation sweep after the testers' results (`docs/backend`, `docs/frontend`, `docs/science`, `docs/data`, `docs/reference` and the assistant's knowledge files) | Claude | Compared the documents with the code and corrected the statements that no longer matched | The team lead, to review |
| 2026-11-15 | The Apollo Journal note on the Accuracy page, the smaller shadow map on weaker devices (`apps/web/src/scene/renderer.ts`) and the matching updates in `docs/VALIDATION.md` | Claude | Wrote the code, tests and text from the team lead's requests and the testers' notes; checked the figures against `GET /accuracy` and the deployed app | The team lead |
| 2026-11-15 | About page "Future scope" section (`apps/web/src/features/about/components/about-section.tsx`) | Claude | Wrote the section's text from the team's two ideas (watching the site during the flight; best spot in an area by quadtree and sliding window) | The team lead |

How the output was checked:

- The Sun and Earth angles are compared with JPL Horizons by an automated test (`apps/api/tests/test_horizons.py`): 16 cases (2 places, Sun and Earth, 4 dates in November and December 2026), all within the 0.05 degree pass rule; the largest difference is 0.0001 degrees. See [science/validation.md](../science/validation.md).
- The LOLA grid reading is checked by a test against a known crater (Shackleton) on the real grid, and the global grid by a test that it matches the polar grid where both cover.
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
- The "Use of Super Intelligence" field of the submission.
- A short section in the repository's README.

The About page of the app does not mention AI use. The assistant's panel carries an "AI" tag, and the site assistant says "AI can make mistakes".
