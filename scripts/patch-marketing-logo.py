#!/usr/bin/env python3
"""Replace marketing nav brand with tittle wordmark PNG (iris + aperture over i)."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / "docs" / "index.html"
WORDMARK = ROOT / "docs" / "iris-wordmark-tittle-light.png"

SVG_START = (
    'class=\\"brand\\" href=\\"#top\\">\\n      <svg viewBox=\\"0 0 100 100\\"'
)
WM_END = '<span class=\\"wm\\">Iris<\\u002Fspan>\\n    <\\u002Fa>'

NEW_BRAND = (
    'class=\\"brand\\" href=\\"#top\\">\\n'
    '      <img src=\\"iris-wordmark-tittle-light.png\\" alt=\\"iris\\" '
    'width=\\"120\\" height=\\"52\\" style=\\"height:52px;width:auto;display:block\\" />\\n'
    '    <\\u002Fa>'
)


def main() -> None:
    if not INDEX.is_file():
        print(f"ERROR: {INDEX} not found", file=sys.stderr)
        sys.exit(1)
    if not WORDMARK.is_file():
        print(f"ERROR: missing {WORDMARK}", file=sys.stderr)
        sys.exit(1)

    text = INDEX.read_text(encoding="utf-8")
    if "iris-wordmark-tittle-light.png" in text:
        print("Marketing brand already uses tittle wordmark PNG.")
        return

    count = 0
    while SVG_START in text and WM_END in text:
        start = text.index(SVG_START)
        end = text.index(WM_END, start) + len(WM_END)
        text = text[:start] + NEW_BRAND + text[end:]
        count += 1

    if count == 0:
        print("ERROR: expected brand block not found", file=sys.stderr)
        sys.exit(1)

    INDEX.write_text(text, encoding="utf-8")
    print(f"Patched {count} brand lockup(s) in {INDEX.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
