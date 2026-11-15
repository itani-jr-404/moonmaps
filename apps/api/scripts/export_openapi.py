"""Write the API's OpenAPI document to packages/contracts/openapi.json (the contract).

Usage: uv run python scripts/export_openapi.py [--check]
"""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "apps" / "api"))

from fastapi.openapi.utils import get_openapi  # noqa: E402

from app.routers import accuracy, analysis, assistant, sites, system, terrain  # noqa: E402

OUT = ROOT / "packages" / "contracts" / "openapi.json"


def build() -> str:
    from fastapi import FastAPI

    from app.core.config import VERSION

    app = FastAPI(title="Moon Maps API", version=VERSION)
    for module in (system, sites, analysis, terrain, accuracy, assistant):
        app.include_router(module.router)
    spec = get_openapi(title=app.title, version=app.version, routes=app.routes)
    return json.dumps(spec, indent=2, sort_keys=True) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Fail if the file is out of date")
    args = parser.parse_args()
    text = build()
    if args.check:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != text:
            print("packages/contracts/openapi.json is out of date; run scripts/export_openapi.py")
            return 1
        print("contract is up to date")
        return 0
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(text, encoding="utf-8")
    print(f"wrote {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
