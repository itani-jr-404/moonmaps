# 3D scenes

Status: Design. Last updated: 2026-11-14.

The app has three interactive 3D scenes, plus the Moon on the landing page. All use three.js through React Three Fiber.

## Shared setup

- One `<Canvas>` on `/explore`. The active view decides which scene group is mounted, and a camera rig moves between them, so going from the Solar System to the Moon to a site is one continuous flight.
- Everything 3D is loaded with a dynamic import and never runs on the server.
- Shared pieces live in `src/scene`: the canvas shell, the camera rig, the starfield, texture loading, unit helpers.
- The three.js convention is Y up. Each scene states its own units below.

### Light

There is one light source in every scene: the Sun. No ambient fill beyond a trace, because on the Moon there is no air to scatter light, and the hard, black shadows are the point.

### Performance budget

| Item | Budget |
| --- | --- |
| Frame rate | 60 on a laptop, 30 on a phone |
| Pixel ratio | Clamped between 1 and 2 |
| Textures | At most 4096 px wide on desktop, 2048 on mobile, as JPEG or WebP |
| Site terrain mesh | 257 by 257 vertices (about 131,000 triangles) |
| Shadow map | 2048 px |
| Rendering | On demand: no frames are drawn while nothing moves |

Geometry, materials and textures are disposed when a scene unmounts.

### Fallback

If WebGL is unavailable or the first frames are very slow, the scene is replaced by a still image and a notice. The panorama, timeline and metrics do not depend on 3D.

## Scene 1: Solar System

Purpose: set the stage, then lead the eye to the Earth and Moon.

- **Data:** `GET /scene?t=`, which gives each planet's true ecliptic longitude, latitude and distance.
- **Placement:** each planet is drawn at its true longitude, but on evenly spaced orbit rings and at an exaggerated size. Real distances and sizes would leave nothing visible. The screen says "not to scale".
- **Bodies:** the Sun (glowing, with bloom), Mercury to Neptune with surface textures, Saturn's rings, the Moon next to the Earth on an enlarged orbit.
- **Interaction:** drag to orbit, scroll to zoom, click a body for its name. Clicking the Earth or the Moon flies the camera in and switches to the Moon view.
- **Textures:** Earth from NASA's Blue Marble. The other planets are still to be chosen; whatever is used must be free to use and credited. See [data/sources.md](../data/sources.md).

## Scene 2: Moon globe

Purpose: choose a site.

- **Units:** the Moon is a sphere of radius 1.
- **Surface:** the color map from NASA's CGI Moon Kit, with the kit's elevation map used for relief shading.
- **Light:** a directional light from the sub-solar point given by `GET /scene`, so the lit side is the real lit side for the chosen date.
- **Pins:** one per curated site, coloured by kind.
- **Interaction:** drag to rotate, scroll to zoom, click a pin to select, click anywhere else to create a custom site at that point. The view opens over the south pole.

Latitude and longitude to a point on the unit sphere (matches three.js sphere mapping with longitude 0 at the centre of the texture):

```text
x =  cos(lat) cos(lon)
y =  sin(lat)
z = -cos(lat) sin(lon)
```

A click gives a point `(x, y, z)` on the sphere; the inverse is `lat = asin(y)`, `lon = atan2(-z, x)`.

## Scene 3: Site view

Purpose: see the terrain around the site and how light and shadow move across it.

- **Units:** 1 unit is 1 km. The site is at the origin.
- **Axes:** `+x` east, `+y` up, `-z` north.
- **Terrain:** the tile from `GET /terrain`. A plane with `n - 1` segments per side is laid flat, and each vertex takes its height from the tile. Row 0 of the tile is the north edge. Heights are true scale by default, with a toggle for 2x exaggeration.
- **Marker:** a small lander model or pin at the origin.
- **Sky:** black, with the starfield. The Sun and the Earth are drawn as discs far away, in the directions the API gives.

Direction to a body from its azimuth `A` and elevation `E`:

```text
x =  cos(E) sin(A)
y =  sin(E)
z = -cos(E) cos(A)
```

- **Light:** a directional light placed along the Sun's direction, pointing at the origin, casting shadows.
- **Time:** the light direction comes from the analysis already loaded, interpolated at the slider's current time. Dragging the slider or pressing play moves the shadows with no network call.

### Distant terrain

The mesh covers about 40 km. A mountain 100 km away can still hide the Sun, and that mountain is not in the mesh. So the scene combines two things:

1. Shadows cast by terrain inside the tile, from the shadow map.
2. Blocking by everything farther away, from the horizon profile: when the API says the Sun is not visible, the light is turned off, and it is dimmed as the Sun's `clearance` approaches zero.

This keeps the picture consistent with the numbers.

### Low Sun and shadow quality

At the pole the Sun is one or two degrees up, so shadows are extremely long. Shadow maps are weakest in exactly this case. If the result is poor, the fallback is to compute the shadow in the terrain's shader: for each point, step toward the Sun through the height texture and check whether the terrain rises above the line of sight. This is the same idea as the horizon walk, done on the graphics card.

## Horizon panorama (2D)

Not a 3D scene, but it shares the data. It is an SVG:

- horizontal axis: azimuth 0 to 360, labelled N, E, S, W;
- vertical axis: elevation, by default from -5 to +15 degrees, adjusting to the data;
- the terrain horizon as a filled silhouette;
- the Sun's path and the Earth's path over the range as lines, drawn solid where visible and faint where hidden;
- markers for the Sun and the Earth at the current time.

SVG is used because the picture is a few hundred points, needs crisp lines and labels, and must be readable by assistive technology.

## Landing page Moon

A single lit, slowly turning Moon, described in [landing-page.md](landing-page.md). It uses the same texture loader and a lower resolution texture.
