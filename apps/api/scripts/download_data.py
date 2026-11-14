"""Download the large data files the API needs. They stay out of git (see .gitignore).

Sources (docs/data/sources.md):
- JPL kernels from NAIF: https://naif.jpl.nasa.gov/pub/naif/generic_kernels/
- LOLA polar elevation grids: https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG/

Usage: uv run python scripts/download_data.py [--no-dem]
"""

import argparse
import shutil
import sys
import urllib.request
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "app" / "data"
NAIF = "https://naif.jpl.nasa.gov/pub/naif/generic_kernels"
LOLA = "https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG"

KERNELS = {
    "de421.bsp": f"{NAIF}/spk/planets/a_old_versions/de421.bsp",
    "moon_pa_de421_1900-2050.bpc": f"{NAIF}/pck/moon_pa_de421_1900-2050.bpc",
    "moon_080317.tf": f"{NAIF}/fk/satellites/moon_080317.tf",
    "pck00008.tpc": f"{NAIF}/pck/a_old_versions/pck00008.tpc",
}
GRIDS = ["LDEM_80S_80M", "LDEM_75S_120M"]


def fetch(url: str, target: Path) -> None:
    if target.exists() and target.stat().st_size > 0:
        print(f"have {target.name}")
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    partial = target.with_suffix(target.suffix + ".part")
    print(f"get  {url}")
    with urllib.request.urlopen(url, timeout=120) as response, partial.open("wb") as out:
        shutil.copyfileobj(response, out, length=1 << 20)
    partial.rename(target)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-dem", action="store_true", help="Skip the elevation grids")
    args = parser.parse_args()
    for name, url in KERNELS.items():
        fetch(url, DATA / "kernels" / name)
    if not args.no_dem:
        for grid in GRIDS:
            for ext in ("LBL", "IMG"):
                fetch(f"{LOLA}/{grid}.{ext}", DATA / "dem" / f"{grid}.{ext}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
