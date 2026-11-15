"""The assistant's knowledge base: the Markdown files in app/data/knowledge, plus a list of the
curated sites generated from sites.json. Design: docs/backend/assistant.md.

While the files fit in one request, ``select`` returns all of them. Retrieval, if it is ever
needed, replaces only that method.
"""

import re
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

from app.services.sites import SiteService

URL_RE = re.compile(r"https?://[^\s<>()\"'\]]+")


@dataclass(frozen=True)
class Passage:
    id: str
    title: str
    text: str


def _title(text: str, fallback: str) -> str:
    for line in text.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return fallback


def _sites_passage(sites: SiteService) -> Passage:
    lines = [
        "# Curated landing sites",
        "",
        "The sites offered in the app's site list. Ids are what the tools accept as site_id.",
        "Latitude south is negative; longitude is east-positive.",
        "",
    ]
    for site in sites.list():
        when = f", {site.mission_date}" if site.mission_date else ""
        about = f" {site.description}" if site.description else ""
        where = f"lat {site.lat}, lon {site.lon}"
        lines.append(f"- {site.name} (id {site.id}; {site.kind}{when}; {where}).{about}")
    lines += [
        "",
        "Source: apps/api/app/data/sites.json; each site's source is in docs/data/sites.md.",
    ]
    return Passage(id="sites", title="Curated landing sites", text="\n".join(lines))


class KnowledgeBase:
    def __init__(self, folder: Path, sites: SiteService) -> None:
        passages = []
        if folder.is_dir():
            for path in sorted(folder.glob("*.md")):
                text = path.read_text(encoding="utf-8").strip()
                passages.append(Passage(id=path.stem, title=_title(text, path.stem), text=text))
        passages.append(_sites_passage(sites))
        self._passages = passages
        self._by_id = {p.id: p for p in passages}
        self.allowed_hosts = frozenset(
            (urlparse(url).hostname or "").lower()
            for p in passages
            for url in URL_RE.findall(p.text)
        ) - {""}

    def select(self, question: str) -> list[Passage]:
        return list(self._passages)

    def get(self, passage_id: str) -> Passage | None:
        return self._by_id.get(passage_id)
