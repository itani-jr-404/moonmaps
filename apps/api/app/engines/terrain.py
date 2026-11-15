"""LOLA elevation grids: reading the files and looking up heights.

The file layout comes from each grid's PDS label (for example
https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG/LDEM_80S_80M.LBL and
https://imbrium.mit.edu/DATA/LOLA_GDR/CYLINDRICAL/IMG/LDEM_16.LBL): an image of little-endian
signed 16-bit integers, height in metres = value * SCALING_FACTOR, relative to a sphere of
radius 1737.4 km (OFFSET = 1737400.).

Polar grids are in polar stereographic projection centred on the pole. The projection is
described in the LOLA catalogue file DSMAP_POLAR.CAT
(https://imbrium.mit.edu/CATALOG/DSMAP_POLAR.CAT): in the south, longitude 0 points up from
the centre of the image and longitude 90 east points to the right, with
r = 2 R tan((90 - |lat|) / 2).

The global grids are in simple cylindrical projection. The catalogue file DSMAP.CAT
(https://imbrium.mit.edu/CATALOG/DSMAP.CAT) gives, for 1-based pixels,
LINE = NINT(LINE_PROJECTION_OFFSET - RES * (LAT - CENTER_LATITUDE)) + 1 and
SAMPLE = NINT(SAMPLE_PROJECTION_OFFSET + RES * (LON - CENTER_LONGITUDE)) + 1, so the
fractional 0-based pixel centre is the same expression without the rounding and the + 1.
"""

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

import numpy as np
from numpy.typing import ArrayLike, NDArray

# Radius of the reference sphere of the LOLA products and of JPL Horizons, in metres.
MOON_RADIUS_M = 1_737_400.0


class Grid(Protocol):
    """What the horizon walk and the elevation tile need from any elevation grid."""

    @property
    def name(self) -> str: ...

    @property
    def scale_m(self) -> float:
        """Metres per pixel (MAP_SCALE; for a cylindrical grid, at the equator)."""
        ...

    def height_m(self, lat: ArrayLike, lon: ArrayLike) -> NDArray[np.float64]: ...


@dataclass(frozen=True)
class PolarGrid:
    name: str
    heights: NDArray[np.int16]  # memory-mapped, shape (lines, samples)
    scale_m: float  # metres per pixel (MAP_SCALE)
    scaling_factor: float  # metres per stored unit (SCALING_FACTOR)
    line_offset: float  # LINE_PROJECTION_OFFSET, 0-based pixel of the pole
    sample_offset: float  # SAMPLE_PROJECTION_OFFSET
    south: bool

    @property
    def size(self) -> int:
        return int(self.heights.shape[0])

    def to_pixel(
        self, lat: ArrayLike, lon: ArrayLike
    ) -> tuple[NDArray[np.float64], NDArray[np.float64]]:
        """Fractional (line, sample) for latitude and east longitude in degrees."""
        lat_r = np.radians(np.asarray(lat, dtype=float))
        lon_r = np.radians(np.asarray(lon, dtype=float))
        r = 2.0 * MOON_RADIUS_M * np.tan((np.pi / 2 - np.abs(lat_r)) / 2.0) / self.scale_m
        sample = self.sample_offset + r * np.sin(lon_r)
        # South: longitude 0 points up (smaller line numbers). North: it points down.
        line = (
            self.line_offset - r * np.cos(lon_r)
            if self.south
            else self.line_offset + r * np.cos(lon_r)
        )
        return line, sample

    def height_m(self, lat: ArrayLike, lon: ArrayLike) -> NDArray[np.float64]:
        """Bilinear height in metres; NaN where the point is outside the grid."""
        line, sample = self.to_pixel(lat, lon)
        line, sample = np.broadcast_arrays(line, sample)
        n = self.size
        inside = (line >= 0) & (line <= n - 1) & (sample >= 0) & (sample <= n - 1)
        hemisphere = np.asarray(lat, dtype=float)
        hemisphere = np.broadcast_to(hemisphere < 0 if self.south else hemisphere > 0, line.shape)
        inside &= hemisphere
        out = np.full(line.shape, np.nan)
        if not inside.any():
            return out
        li, si = line[inside], sample[inside]
        l0 = np.clip(np.floor(li).astype(np.int64), 0, n - 2)
        s0 = np.clip(np.floor(si).astype(np.int64), 0, n - 2)
        fl, fs = li - l0, si - s0
        h = self.heights
        top = h[l0, s0] * (1 - fs) + h[l0, s0 + 1] * fs
        bottom = h[l0 + 1, s0] * (1 - fs) + h[l0 + 1, s0 + 1] * fs
        out[inside] = (top * (1 - fl) + bottom * fl) * self.scaling_factor
        return out


@dataclass(frozen=True)
class CylindricalGrid:
    """A global grid in simple cylindrical projection, rows from north to south."""

    name: str
    heights: NDArray[np.int16]  # memory-mapped, shape (lines, samples)
    pixels_per_degree: float  # MAP_RESOLUTION
    scale_m: float  # MAP_SCALE, metres per pixel at the equator
    scaling_factor: float  # metres per stored unit (SCALING_FACTOR)
    line_offset: float  # LINE_PROJECTION_OFFSET
    sample_offset: float  # SAMPLE_PROJECTION_OFFSET
    center_lat: float  # CENTER_LATITUDE
    center_lon: float  # CENTER_LONGITUDE

    def to_pixel(
        self, lat: ArrayLike, lon: ArrayLike
    ) -> tuple[NDArray[np.float64], NDArray[np.float64]]:
        """Fractional 0-based (line, sample); the sample wraps around the globe."""
        res = self.pixels_per_degree
        line = self.line_offset - res * (np.asarray(lat, dtype=float) - self.center_lat)
        sample = self.sample_offset + res * (np.asarray(lon, dtype=float) - self.center_lon)
        return line, np.mod(sample, self.heights.shape[1])

    def height_m(self, lat: ArrayLike, lon: ArrayLike) -> NDArray[np.float64]:
        """Bilinear height in metres. Every point on the Moon is covered.

        Within half a pixel of a pole the first or last row is used as it is.
        """
        line, sample = self.to_pixel(lat, lon)
        line, sample = np.broadcast_arrays(line, sample)
        lines, samples = self.heights.shape
        line = np.clip(line, 0.0, lines - 1.0)
        l0 = np.clip(np.floor(line).astype(np.int64), 0, lines - 2)
        s0 = np.floor(sample).astype(np.int64) % samples
        s1 = (s0 + 1) % samples
        fl, fs = line - l0, sample - np.floor(sample)
        h = self.heights
        top = h[l0, s0] * (1 - fs) + h[l0, s1] * fs
        bottom = h[l0 + 1, s0] * (1 - fs) + h[l0 + 1, s1] * fs
        return np.asarray((top * (1 - fl) + bottom * fl) * self.scaling_factor, dtype=float)


class GridStack:
    """Several grids, finest first. A lookup uses the first grid that covers the point."""

    def __init__(self, grids: list[Grid]) -> None:
        self.grids = grids

    def height_m(self, lat: ArrayLike, lon: ArrayLike) -> NDArray[np.float64]:
        lat_a, lon_a = np.broadcast_arrays(np.asarray(lat, float), np.asarray(lon, float))
        out = np.full(lat_a.shape, np.nan)
        for grid in self.grids:
            todo = np.isnan(out)
            if not todo.any():
                break
            out[todo] = grid.height_m(lat_a[todo], lon_a[todo])
        return out

    def source_for(self, lat: float, lon: float) -> str | None:
        """Name of the grid that covers this point, or None."""
        grid = self.grid_for(lat, lon)
        return grid.name if grid is not None else None

    def grid_for(self, lat: float, lon: float) -> Grid | None:
        """The finest grid that covers this point, or None."""
        for grid in self.grids:
            if not np.isnan(grid.height_m(lat, lon)).all():
                return grid
        return None


_LABEL_KEYS: dict[str, type] = {
    "LINES": int,
    "LINE_SAMPLES": int,
    "SAMPLE_TYPE": str,
    "SAMPLE_BITS": int,
    "SCALING_FACTOR": float,
    "MAP_SCALE": float,
    "LINE_PROJECTION_OFFSET": float,
    "SAMPLE_PROJECTION_OFFSET": float,
    "CENTER_LATITUDE": float,
}
_CYLINDRICAL_KEYS: dict[str, type] = {
    **_LABEL_KEYS,
    "CENTER_LONGITUDE": float,
    "MAP_RESOLUTION": float,
}


def read_label(text: str, keys: dict[str, type] | None = None) -> dict[str, object]:
    """The few PDS label values the reader needs."""
    values: dict[str, object] = {}
    for key, cast in (keys or _LABEL_KEYS).items():
        match = re.search(rf"^\s*{key}\s*=\s*\"?([^\"<\n]+?)\"?\s*(<[^>]*>)?\s*$", text, re.M)
        if match is None:
            raise ValueError(f"Label has no {key}")
        values[key] = cast(match.group(1).strip())
    return values


def load_polar_grid(img_path: Path, lbl_path: Path) -> PolarGrid:
    label = read_label(lbl_path.read_text(encoding="latin-1"))
    if label["SAMPLE_TYPE"] != "LSB_INTEGER" or label["SAMPLE_BITS"] != 16:
        raise ValueError(f"{lbl_path.name}: expected 16-bit little-endian integers")
    lines, samples = int(label["LINES"]), int(label["LINE_SAMPLES"])  # type: ignore[arg-type]
    heights = np.memmap(img_path, dtype="<i2", mode="r", shape=(lines, samples))
    return PolarGrid(
        name=img_path.stem.lower().replace("ldem_", "lola-").replace("_", "-"),
        heights=heights,
        scale_m=float(label["MAP_SCALE"]),  # type: ignore[arg-type]
        scaling_factor=float(label["SCALING_FACTOR"]),  # type: ignore[arg-type]
        line_offset=float(label["LINE_PROJECTION_OFFSET"]),  # type: ignore[arg-type]
        sample_offset=float(label["SAMPLE_PROJECTION_OFFSET"]),  # type: ignore[arg-type]
        south=float(label["CENTER_LATITUDE"]) < 0,  # type: ignore[arg-type]
    )


def _projection(text: str) -> str:
    match = re.search(r'^\s*MAP_PROJECTION_TYPE\s*=\s*"?([^"\n]+?)"?\s*$', text, re.M)
    if match is None:
        raise ValueError("Label has no MAP_PROJECTION_TYPE")
    return match.group(1).strip().upper()


def load_cylindrical_grid(img_path: Path, lbl_path: Path) -> CylindricalGrid:
    label = read_label(lbl_path.read_text(encoding="latin-1"), _CYLINDRICAL_KEYS)
    if label["SAMPLE_TYPE"] != "LSB_INTEGER" or label["SAMPLE_BITS"] != 16:
        raise ValueError(f"{lbl_path.name}: expected 16-bit little-endian integers")
    lines, samples = int(label["LINES"]), int(label["LINE_SAMPLES"])  # type: ignore[arg-type]
    heights = np.memmap(img_path, dtype="<i2", mode="r", shape=(lines, samples))
    ppd = float(label["MAP_RESOLUTION"])  # type: ignore[arg-type]
    return CylindricalGrid(
        name=f"lola-global-{ppd:g}ppd",
        heights=heights,
        pixels_per_degree=ppd,
        scale_m=float(label["MAP_SCALE"]),  # type: ignore[arg-type]
        scaling_factor=float(label["SCALING_FACTOR"]),  # type: ignore[arg-type]
        line_offset=float(label["LINE_PROJECTION_OFFSET"]),  # type: ignore[arg-type]
        sample_offset=float(label["SAMPLE_PROJECTION_OFFSET"]),  # type: ignore[arg-type]
        center_lat=float(label["CENTER_LATITUDE"]),  # type: ignore[arg-type]
        center_lon=float(label["CENTER_LONGITUDE"]),  # type: ignore[arg-type]
    )


def load_grid(img_path: Path, lbl_path: Path) -> Grid:
    """A polar or a global grid, chosen by the label's MAP_PROJECTION_TYPE."""
    projection = _projection(lbl_path.read_text(encoding="latin-1"))
    if projection == "SIMPLE CYLINDRICAL":
        return load_cylindrical_grid(img_path, lbl_path)
    if projection == "POLAR STEREOGRAPHIC":
        return load_polar_grid(img_path, lbl_path)
    raise ValueError(f"{lbl_path.name}: projection {projection} is not supported")
