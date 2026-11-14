#!/usr/bin/env python3
"""Check that relative links in the repository's Markdown files point at files that exist.

Run from the repository root:  python3 scripts/check_docs_links.py
Exits with status 1 and lists every broken link if any are found.
"""
import os
import re
import sys
from urllib.parse import unquote

SKIP_DIRS = {".git", "node_modules", ".next", ".venv", "dist", "out", "local", "coverage"}

# Saved copies of web pages. Their links point at the original website, not at this repository.
SKIP_PREFIXES = (
    "research/challenges",
    "research/space-apps-guides",
    "research/second-scrape",
)

FENCED_CODE = re.compile(r"```.*?```", re.S)
INLINE_CODE = re.compile(r"`[^`\n]*`")
LINK = re.compile(r"\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+\"[^\"]*\")?\s*\)")
EXTERNAL = ("http://", "https://", "mailto:", "tel:", "#")


def markdown_files(root):
    for folder, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        rel_folder = os.path.relpath(folder, root).replace(os.sep, "/")
        if rel_folder.startswith(SKIP_PREFIXES):
            continue
        for name in files:
            if name.endswith(".md"):
                yield os.path.join(folder, name)


def broken_links(root, path):
    with open(path, encoding="utf-8") as handle:
        text = handle.read()
    text = INLINE_CODE.sub("", FENCED_CODE.sub("", text))
    for match in LINK.finditer(text):
        target = match.group(1)
        if target.startswith(EXTERNAL):
            continue
        target = unquote(target.split("#")[0])
        if not target:
            continue
        base = root if target.startswith("/") else os.path.dirname(path)
        resolved = os.path.normpath(os.path.join(base, target.lstrip("/")))
        if not os.path.exists(resolved):
            yield match.group(1)


def main():
    root = os.getcwd()
    checked = 0
    problems = []
    for path in sorted(markdown_files(root)):
        checked += 1
        for target in broken_links(root, path):
            problems.append((os.path.relpath(path, root), target))
    for path, target in problems:
        print(f"BROKEN  {path}  ->  {target}")
    print(f"{checked} Markdown files checked, {len(problems)} broken links.")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
