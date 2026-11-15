# How to use Moon Maps

Last updated: 2026-11-15.

Moon Maps is one long page. For a place on the Moon and a moment in time, it says whether a lander would have sunlight for its solar panels and the Earth in view for a direct radio link. "Good landing site" means both are above the terrain horizon at that moment. Nothing else is checked: not slopes, rocks or safety.

All Sun and Earth answers come from the Moon Maps API. In the 3D views only the Sun and Earth directions and the yes/no answers come from the API; the ground is drawn for looks.

## The pages

Moon Maps has separate pages. The menu at the top links to them: Home, Explore, Planner, Sites, Accuracy and About, plus the "Open the planner" button. The page you are on is underlined. On a phone, the menu button opens the same links (Home, Choose a landing, Planner, Sites, How sure are we, About). "Skip to main content" is the first link for keyboard users.

| Page | Address | What it is for |
| --- | --- | --- |
| Home | `/` | Headline, the live south pole readout, cards that open each page ("What you can do"), then why the south pole matters |
| Choose a landing | `/explore` | A 3D Moon to aim at and land on |
| Planner | `/planner` | Pick a place and a date; the answer, the 30-day calendar, the best times and a 3D view |
| Sites | `/sites` | Every curated landing site as a card, grouped by kind, with a "right now" line |
| A site's page | `/sites/<id>`, or `/sites/spot?lat=..&lon=..` for any spot | Everything about one site, and a chat that knows that site |
| Accuracy | `/accuracy` | How accurate the numbers are, and what the app learned from past data |
| About | `/about` | What the app does, how it works, its limits |

## A site's page (`/sites/<id>`)

Open it from a card on Sites, from "See everything about this spot" in the landing panel on Choose a landing, or by link.

- Header: the name, the kind of site, coordinates, mission date, description and its source; "Open in planner" and "Copy link".
- "Right now": whether the Sun and the Earth are in view, their elevation and azimuth, the terrain horizon in that direction, and "How far away is the Earth?" with two distances. "From this site to the nearest point on Earth's surface" is measured from the site at the Moon's reference radius (local hills not counted) to the closest point of the Earth, taken as a ball of its equatorial radius (from `GET /sky`, the `sky_at` tool). "Centre of the Earth to centre of the Moon" is the usual Earth–Moon distance, the same for every site (from `GET /scene`, the `moon_scene` tool). The first is shorter by about one Moon radius plus one Earth radius on the side facing the Earth.
- "Is it a good landing site, and for how long?": if good now, until when; if not, when it is next good and for how long; the next good windows.
- "Can a lander stay, or must it leave?": next sunset or sunrise, next Earthset or Earthrise, the longest dark spell and the longest time without the Earth in view in the next 30 days.
- "Sky forecast": the next 14 days, day by day, with hours of Sun, Earth and both; and a horizon panorama with the terrain skyline and the paths of the Sun and the Earth over the next 3 days.
- "The ground": a shaded elevation map of the ground 60 km across around the site, north up, with the site as a dot in the middle, a colour legend in metres, a north arrow, a scale bar, and the lowest, highest and site heights. Heights are metres above a 1737.4 km sphere. The shading uses a light from the north-west only to show the shape of the ground; it is not the Sun.
- "Getting there": how long past missions took from launch to landing, with sources, and the mission that landed at this site if any. Under "When to leave Earth": "To land when the next good window opens on <date UTC>, leave Earth by:" and one line per past mission with a known travel time, for example "<date> UTC, Apollo 11-style trip, 4.3 days". The API subtracts each mission's launch-to-landing time from the start of the next window with the Sun and the Earth both in view (`GET /missions/departures`). A time marked "already past" cannot be met with that trip length. If there is no good window in the next 30 days, it says so instead.
- "How sure are we": a link to the Accuracy page.
- An unknown site or bad coordinates show "We do not know this site" or "This spot is not on the Moon map".

## The site assistant

On a site's page, a chat opens on the right by itself after about a second (a bottom sheet on a phone): "Ask about <site>". It already has the next 30 days for that site, so it can answer at once. Four suggestion cards start a question ("When is it next good for landing?", "How long can a lander stay here?", "Where will the Earth be this week?", "How did past missions get here?"). Each answer has sources, "Copy", "Retry" and, when it names a place and time, "Show in the planner". Collapse, Close or Escape folds it into an "Ask about <site>" button. Each site has its own conversation, kept only in the open tab. The round assistant button at the bottom right is hidden on site pages so the two do not overlap.

## Accuracy (`/accuracy`)

- "Error rates": how close our Sun and Earth positions are to NASA JPL Horizons, how our Sun elevation at the 16 Apollo moonwalk times compares, and our long-term sunlight and Earth visibility against NASA's polar maps, before and after learning.
- "Learning from past data": a small model (ridge regression) learned how our long-term values differ from NASA's maps at 300 points, tested on points it did not see. The page shows the error before and after, and its limits: counting any part of the Sun's or Earth's disc, with no learning, does even better, and the model is not applied to 30-day results.
- "Past landings": a table of the Apollo moonwalk times with our value, JPL Horizons and the Apollo Lunar Surface Journal.
- "Positions vs JPL Horizons": the number of cases, the largest difference and the pass rule.

## Home (`/`)

- On first load a short intro plays. The "Skip intro" button ends it.
- Headline: "Pick the site. Pick the hour." Buttons: "Plan a landing" (to the planner) and "Choose a landing" (to the 3D Moon).
- "Right now at the south pole" shows Sunlight ("Yes, the Sun is up" or "No, it is dark") and Earth ("In view" or "Hidden"). This is the API's answer for 89.9 S, 0 E, asked again every minute. "--" means it is loading; "Unavailable" means the API could not be reached.
- "Your time" is your device's clock. The astronaut, Moon and Earth behind the text are decoration. The astronaut turns once when the intro ends; clicking does not move it. The 3D picture stops drawing when you scroll past it or switch tabs.

## Choose a landing (`/explore`)

The south polar region faces you at the start. Small dots mark the curated sites.

1. Drag to turn the Moon in any direction. It keeps turning slowly by itself when you let go.
2. Point at a spot with the mouse. A red arrow and a card ("Land here?") appear:
   - "Checking…" while the API answers;
   - "Good landing site" or "Bad landing site", the place, "Sunlight right now: Yes/No", "Can see Earth: Yes/No" and one sentence saying why;
   - "Could not check this spot" if the API did not answer. Move the pointer off the Moon and back to try again.
   The card is always for right now, not the planner's date. On a site's dot the card shows that site and a click lands on it. Anywhere else the card shows the point itself, such as "Spot 85.3°S, 30.2°E", with "near <site>" when a curated site is within 2.2 degrees; a click lands on exactly that point, never on the nearby site.
3. Click to land. You dive in and stand on the spot. The panel shows "Landed", the place (the site name, or the spot's coordinates with "near <site>" when one is close), the verdict and why, the time with "(now)" or "(skipped ahead)", Sunlight, Can see Earth, and "You are facing …". Drag to look around. The Sun and Earth are drawn where the API puts them, with a "SUN" or "EARTH" label, and only when the API says they are visible; the answer refreshes every minute. The ground in this view is only a drawing; the yes and no answers come from the API's terrain horizon, so the drawn hills never hide a body the API calls visible.
   Once you land, the assistant's "ON SCREEN" strip shows the landed spot and its time, and questions to the assistant are about that spot.
4. Buttons in the panel:
   - "Back to orbit" returns to the globe.
   - "Skip to sunrise" (only when it is dark) jumps to just after the next sunrise within 35 days. If there is none: "The Sun does not rise here in the next 35 days."
   - "See the best dates" sends the spot and time to the planner and scrolls there ("Showing the best dates for this spot.").

## Why the south pole (on Home, `/#why`)

Near the end of the home page, after the "What you can do" cards. Three cards: "There is ice", "The Sun stays low", "Earth comes and goes".

## The planner (`/planner`)

### Step 1: "Where do you want to land?"

Buttons for curated places: "Shackleton rim ridge" (the default), "Malapert Massif", "Haworth", "Mons Mouton", "de Gerlache rim", "South Pole", "Chandrayaan-3 (India)", "Apollo 11". The chosen one is highlighted. A spot picked on the globe appears as an extra button, "Your chosen spot (85.300°S  30.200°E)". Other curated sites open only through a link (see Sharing).

### Step 2: "When?"

- "Date" and "Time" fields. Changing the date keeps the time; an empty time means 12:00.
- Quick buttons: "Now", "Tomorrow", "In a week", "In a month". They set that day at the nearest whole hour.
- "Times are shown in your own time zone." This holds for every time on the page.

### The answer card

"Our answer for", the place, the full date and time, then "Good landing site" or "Bad landing site" and a sentence on why. Two facts:

- "Sunlight for power": "Yes, for the next 5 days 3 hours" (until sunset), "Yes, for more than a month", "No. Sunlight returns Wed 25 Nov, 16:10" (next sunrise) or "No sunlight in the next month".
- "Can talk to Earth": "Yes, for the next …" (until Earthset), "Yes, for more than a month", "No. Earth comes back into view Tue 17 Nov, 21:16" (next Earthrise) or "Earth stays hidden for the next month".

The card looks 35 days ahead from the chosen moment. "Updating…" means a newer answer is on its way.

### "The next 30 days at this place"

30 day tiles, from today in your time zone. They always start today, whatever date you picked. Each tile is graded by how many hours both the Sun and the Earth are visible:

- green, "Good day": 18 hours or more;
- amber, "Good for some hours (N)": some, but under 18;
- dark blue-grey, "Not good": none.

Click a day to check it: the time moves to one hour into that day's first good stretch (or its middle if it is under two hours), or to noon if the day has none. The tile is outlined.

### "Best times to land here"

Up to four of the longest stretches in the next 30 days when both are visible, in time order. Each shows start, "until" end, and length. A stretch already under way counts from now. Clicking one checks a moment one hour into it (or its middle if it is under two hours).

### "See the spot in 3D"

A block of ground around the place with the lander, a compass ring, and beams: amber for "Direction of the Sun", teal for "Direction of Earth". "Drag to turn, scroll to zoom". It turns slowly by itself after a few seconds without input. The line below says where the horizon came from:

- "Horizon from NASA LOLA terrain (80 m grid)" or "(120 m grid)": real terrain was used, from the 80 m grid south of 80 S or the 120 m grid between 75 S and 80 S.
- "Horizon from NASA LOLA terrain (global grid, 16 pixels per degree)": real terrain from the global grid, about 1.9 km per pixel, used everywhere north of 75 S.
- "Smooth Moon: no terrain data loaded for this place": only if the elevation data is missing on the server; the Moon is then treated as a smooth ball.
- In every case the 3D ground itself is decorative, with heights exaggerated two times.

## About (`/about`)

Three columns: "What it does for you", "The simple idea behind it" and "Good to know". It says the app is a planning and learning tool, not flight software.

## Sharing a link

On the Planner page, the address keeps the place and time:

- `?site=<id>` for a curated site, for example `/planner?site=malapert-massif&t=2027-03-01T12:00Z`.
- `?lat=<lat>&lon=<lon>` for any point, for example `/planner?lat=-85.3&lon=30.2&t=2027-03-01T12:00Z`. South is negative, east is positive; longitude can be -180 to 360.
- `?t=` is the moment in UTC (the trailing `Z`).

Site ids of the Step 1 buttons: `shackleton-ridge`, `malapert-massif`, `haworth`, `mons-mouton`, `de-gerlache-rim-2`, `south-pole-reference`, `chandrayaan-3`, `apollo-11`. Any curated id works in a link, even one without a button. Planner links use the `/planner` address, for example `/planner?site=haworth&t=2026-11-20T12:00Z`. A site's own page is `/sites/<id>`. Badly formed values are ignored; a well-formed but unknown site id gives an error, and the 3D view says "This link names a place Moon Maps does not know. Pick a place in step 1." On a fresh visit the address bar shows the parameters after the first change of place or time.

## Loading, empty and error messages

| Message | Where | Meaning and what to do |
| --- | --- | --- |
| "Working it out…", "Loading places…", "Checking the next 30 days…", "Finding the best times…", "Finding the Sun and the Earth…", "Checking the sky here…", "Loading the Moon…" | Various | Loading. Wait a moment. |
| "We could not reach the Moon Maps API. Check your connection and try again." | Planner, 3D view | The API is down or you are offline. Press "Try again". |
| "Dates must be between 1900-01-02 and 2050-12-30, the range of the JPL kernels." | Answer card | Pick a date in range. |
| "No curated site has the id '…'." | Answer card | The link has a wrong `site=` id. Pick a place in Step 1. |
| "Something went wrong on our side." or "The Moon Maps API answered 500." (any number) | Any | API fault. Try again later. |
| "The calendar could not be loaded." / "The best times could not be loaded." | Calendar, best times | The request failed; use "Try again" on the answer card. |
| "No good landing times here in the next 30 days. Try another place." | Best times | Nothing is wrong; this place has no good stretch. |
| "Could not check this spot" / "Could not check this spot." | Globe card / landed panel | The API did not answer for that spot. Re-aim, or press "Try again". |
| "Your browser cannot show the 3D Moon." | Globe | No WebGL. The planner still works. |
| "Unavailable" | Opening screen | The live readout could not reach the API. |
| "--" | Answer card, opening screen | No answer yet. |

## Phone and desktop

- Phones show the same features in one column.
- Touch screens have no hover, so a tap on the Moon lands at once; the answer is in the landed panel.
- On the globe and the 3D view, a vertical swipe scrolls the page and a sideways drag turns the view. Zooming the 3D view needs a mouse wheel or trackpad.

## Reduced motion

If the device asks for reduced motion, there is no intro, everything shows at once, links jump instead of gliding, the globe and 3D view do not turn by themselves, the landing dive is instant, and the astronaut does not spin. Every feature still works.

## Limits

- Dates from 1900-01-02 to 2050-12-30. The answer card looks 35 days ahead, so it works up to about 25 November 2050.
- Terrain is 80 m or 120 m per pixel from 75 S to the pole, and about 1.9 km per pixel elsewhere, so nearby hills there are smoothed. The 3D ground in all views is decorative.
- The planner samples every 30 minutes; rise and set times between samples are interpolated.
- The globe card uses the time rounded down to 10 minutes and the point rounded to 0.1 degree.
- The globe needs a mouse or touch; it has no keyboard control. The planner works with a keyboard.

## Common questions

**Why does the calendar not show the month I picked?** It always covers the 30 days from today.

**Why do the globe card and the planner disagree?** The globe card is for right now; the planner is for the chosen time.

**How do I check a spot that is not in the list?** Click it on the globe, then "See the best dates"; or use a `?lat=&lon=` link.

**Why does the 3D ground not match photos?** It is decorative. The answer uses the real LOLA horizon.

**Why is the Apollo 11 horizon from a "global grid"?** It is near the equator, outside the fine south polar maps, so its horizon comes from NASA's global LOLA map, about 1.9 km per pixel.

**What does "Good for some hours (5)" mean?** About 5 hours that day with both visible.

**Is this safe for a real mission?** No. It is a planning and learning tool, not flight software.

## The assistant

- The dark rounded square at the bottom right of every screen, with a small Moon and orbit, labelled "Ask the Moon Maps assistant", opens the chat. It appears after the intro. The small light on its corner is green when all is well; it turns amber and shows a number when answers arrived while the chat was closed. The close button or the Escape key closes the chat. On a phone the chat fills the screen.
- Before the chat is opened, two suggested questions float next to the button ("Is this spot good right now?" and "How do I use Moon Maps?"). Tapping one opens the chat and asks it. The small X hides them.
- The header shows the time now in UTC and "LINK OK", or "NO LINK" when the assistant cannot be reached. The square icon button starts a new chat.
- Two tabs sit under the header: "Chat" and "Resources". "Resources" lists two NASA tools, Moon Trek (maps of the Moon) and the JPL Horizons System (positions of the Sun and the Earth), each opening in a new tab.
- The "ON SCREEN" strip shows what the assistant knows about the page: the site chosen in the planner or landed on in Choose a landing (or "Custom spot" for a point that is not a curated site), its latitude and longitude, and the time in UTC. After a landing it is the landed spot and the time shown in the landed panel.
- At the top of a new chat: "Plan a landing" opens the planner, "Best dates this month" asks for the best landing dates in the next 30 days for the spot on screen, and three suggested questions ask themselves when clicked. The assistant can still answer questions about the NASA Space Apps challenge when asked.
- Type a question and press Enter to send it. Shift and Enter adds a new line. A question can be up to 2,000 characters.
- Typing "/" at the start of the box opens shortcuts: /planner, /landing, /why and /about jump to those parts of the page, /resources opens the Resources tab, and /new starts a new chat. Use the arrow keys and Enter, or click.
- Your questions appear in bubbles on the right. Answers appear on the left under "MOON MAPS" and the time in UTC.
- Every number about a site or a date comes from the Moon Maps API, which the assistant calls while it answers. The numbered chips after "Sources" name the documents and API tools it used; point at one to see its full name.
- When an answer is about one place and time, a card under it shows the place, its coordinates and the time, with a "Load in planner" button that opens them in the planner. The latest answer also offers buttons such as "Explain more simply" and "Is this spot good now?".
- While it works, the chat shows "Working on it", and after 15 seconds "Still working. Free AI models can be slow." "Stop" cancels the question.
- If the connection drops, a strip says "Signal lost, retrying in N s" and tries again after 1, 2, 4 and 8 seconds. A question that still fails is marked "NOT SENT" with a "Retry" button. "Please wait N seconds" means the limit per visitor was reached; the question goes back into the typing box. "The assistant is not available right now" means no AI model can be reached; the rest of Moon Maps still works.
- The conversation is kept only in the open browser tab. Nothing is saved on the server, and reloading the page clears it.
- AI answers can be wrong. Check important numbers in the planner.

## Sources

- Page structure and text: `apps/web/src/app/page.tsx` and `apps/web/src/features/` (hero, landing, why, planner, about, site-chrome).
- Messages and states: `apps/web/src/components/ui/states.tsx`, `apps/web/src/components/ui/toast.tsx`, `apps/web/src/lib/api/client.ts`, `apps/api/app/core/errors.py`, `apps/api/app/services/analysis.py`, `apps/api/app/services/sites.py`.
- Links and time: `apps/web/src/lib/state/url-sync.ts`, `apps/web/src/lib/state/scenario-store.ts`, `apps/web/src/lib/format/format.ts`.
- Behaviour checked by the browser tests: `apps/web/e2e/`.
- Date range: `apps/api/app/engines/ephemeris.py`. Terrain coverage: `docs/data/sources.md`.
- Visibility rule: `docs/science/visibility-and-metrics.md`, `docs/decisions/ADR-005-visibility-by-disc-centre.md`.
