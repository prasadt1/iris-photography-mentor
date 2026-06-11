#!/usr/bin/env python3
"""Build section-wise Devpost collage PNGs from Iris web screenshots."""

from __future__ import annotations

import shutil
import subprocess
import textwrap
from dataclasses import dataclass, field
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SRC = Path.home() / "Desktop" / "Iris-Screenshots-Latest-Jun-7"
OUT_DIR = ROOT / "docs" / "devpost-public"
FONT_ROOT = ROOT / "frontend" / "node_modules" / "@fontsource"
LOGO_SVG = ROOT / "frontend" / "public" / "iris-wordmark-light.svg"
LOGO_PNG = ROOT / "frontend" / "public" / "iris-wordmark-tittle-light.png"

# Iris light theme — warm paper gallery
CANVAS_BG = "#f5f0ea"
HEADER_BG = "#ebe4db"
HEADER_RULE = "#c4b8a8"
PANEL_BG = "#faf9f5"
PANEL_BORDER = "#c4b8a8"
TAG_BG = "#e8e0d6"
TAG_BORDER = "#c4b8a8"
TAG_TEXT = "#57534e"
ACCENT = "#d97706"
TEXT_PRIMARY = "#1c1917"
TEXT_BODY = "#44403c"
BADGE_BG = "#d97706"
BADGE_TEXT = "#ffffff"

PAD = 64
GUTTER = 48


@dataclass
class Panel:
    file: str
    label: str
    tags: list[str] = field(default_factory=list)


@dataclass
class Section:
    slug: str
    title: str
    description: str
    gallery_title: str
    gallery_caption: str
    panels: list[Panel]
    row_cols: list[int]  # columns per row, e.g. [2, 2] or [2, 1]
    tech_tags: list[str] = field(default_factory=list)
    hero_panel: int = 0  # index into panels for single-image hero set
    hero_crop: tuple[float, float, float, float] | None = None  # l, t, r, b (0–1) optional focus crop


SECTIONS: list[Section] = [
    Section(
        slug="01-home-memory",
        title="Home — your library remembered",
        description="Portfolio trends, hero frame, and contact-sheet backdrop — the memory layer judges see first.",
        gallery_title="Home — your library remembered",
        gallery_caption="Dashboard with At a glance scores, best-in-library hero, and a growing contact sheet — not a one-shot critique tool.",
        tech_tags=["MongoDB portfolio memory", "GCS thumbnails", "on-read skill profiles"],
        panels=[
            Panel("Iris-Home-1.png", "Dashboard — hero frame, score trends, and contact-sheet library.", ["GET /portfolio", "hero selection"]),
            Panel("Iris-Home-2.png", "Returning visitor view — capabilities grid and upload entry point.", ["session memory", "upload → Coach"]),
        ],
        row_cols=[2],
    ),
    Section(
        slug="02-glass-box-studio",
        title="Glass Box — Studio critique",
        description="Multimodal Coach on upload: five-axis scores, inspectable reasoning, and grounded principles.",
        gallery_title="Glass Box — photo + five-axis scores",
        gallery_caption="Gemini multimodal critique with spatial overlay, Glass Box reasoning tab, and actionable How to fix guidance.",
        tech_tags=["Coach agent", "Gemini 2.5 Flash", "Glass Box schema write"],
        panels=[
            Panel("Iris-photo-analysis-in-progress.png", "Coach analyzing — multimodal pipeline in progress.", ["multimodal JSON", "GCS upload"]),
            Panel("Iris-photo-analysis-result-1.png", "Overview — five dimensions scored on your photo.", ["5-axis scores", "spatial overlay"]),
            Panel("Iris-photo-analysis-result-2.png", "Glass Box — why Iris scored each dimension.", ["inspectable reasoning", "principles RAG"]),
            Panel("Iris-photo-analysis-result-3.png", "How to fix — concrete next steps on this frame.", ["actionable brief", "library trends"]),
        ],
        row_cols=[2, 2],
        hero_panel=1,
    ),
    Section(
        slug="03-practice",
        title="Practice — adaptive assignments",
        description="Planner proposes focused homework; you accept or decline before it becomes active.",
        gallery_title="Practice — HITL assignments",
        gallery_caption="AI-proposed practice brief with human accept/decline — assignments target your weakest skills from portfolio memory.",
        tech_tags=["Planner agent", "Reflection agent", "HITL accept/decline"],
        panels=[
            Panel(
                "Iris-practice.png",
                "Proposed and active assignments with reflection loop when you complete a shoot.",
                ["skill-gap targeting", "MongoDB assignments"],
            ),
        ],
        row_cols=[1],
    ),
    Section(
        slug="04-mentor-chat",
        title="Mentor — portfolio-aware chat",
        description="ADK orchestrator reads MongoDB memory via MCP — synthesis across sessions, not generic chat.",
        gallery_title="Mentor — ADK orchestrator chat",
        gallery_caption="Multi-agent Mentor chat: orchestrator delegates to sub-agents while grounding answers in your portfolio history.",
        tech_tags=["ADK Orchestrator", "MongoDB MCP", "9 LlmAgents"],
        panels=[
            Panel("Iris-Mentor-Chat-In-Progress.png", "Orchestrator working — reading library context (often 30–90s).", ["tool delegation", "MCP reads"]),
            Panel("Iris-Mentor-Chat-Result.png", "Portfolio-aware reply — bullet synthesis with voiceover support.", ["portfolio grounding", "concise bullets"]),
        ],
        row_cols=[2],
        hero_panel=1,
    ),
    Section(
        slug="05-organize-hitl",
        title="Organize — human in the loop",
        description="Triage agent proposes tags and dedupes; nothing applies until you approve.",
        gallery_title="Organize — human approval required",
        gallery_caption="Backlog triage with tag harmonization and duplicate detection — every bulk change waits in Pending Approvals.",
        tech_tags=["Triage agent", "HITL approvals", "tag harmonization"],
        panels=[
            Panel(
                "Iris-Organize-2.png",
                "Tag proposals — photo thumbnails with suggested labels (golden hour, triage reviewed).",
                ["pending approvals", "photo thumbnails"],
            ),
            Panel(
                "Iris-Organize-1.png",
                "Scan & triage entry — library scan proposes tag groups for your approval.",
                ["Scan my library", "backlog triage agent"],
            ),
        ],
        row_cols=[2],
        hero_panel=0,
    ),
    Section(
        slug="06-my-work-library",
        title="My Work — search & similarity",
        description="Same MongoDB corpus powers gallery browse, NL search, and vector similar photos.",
        gallery_title="My Work — NL search + similar photos",
        gallery_caption="Natural-language library search (Gemini query expansion → Atlas Search) and similar-photo row on expand.",
        tech_tags=["Atlas Search", "Vector Search", "MongoDB MCP"],
        panels=[
            Panel("Iris-My-Work-1.png", "Portfolio gallery — scores, tags, and lazy-loaded grid.", ["portfolio_entries", "lazy grid"]),
            Panel("Iris-My-Work-2.png", "Expanded tile — Glass Box summary and similar photos.", ["Atlas Vector Search", "embeddings"]),
            Panel("Iris-My-Work-3-Search.png", "NL search — short query expanded and ranked by Atlas Search.", ["Gemini expansion", "glass_box_search"]),
        ],
        row_cols=[2, 1],
        hero_panel=2,
    ),
    Section(
        slug="07-working-pro",
        title="Working pro — print sales & settings",
        description="Marketplace listing drafts and persona controls — Print Sales stays behind HITL.",
        gallery_title="Working pro — Print Sales HITL",
        gallery_caption="Listing drafts for Etsy-style print sales plus Settings for persona, theme, and field-coach preferences.",
        tech_tags=["Print Sales Strategist", "persona modes", "HITL listings"],
        panels=[
            Panel("Iris-Print-Sales.png", "Print Sales Strategist — draft listings await explicit approval.", ["listing drafts", "HITL gate"]),
            Panel("Iris-Setting.png", "Settings — hobbyist vs working pro, theme toggle, coach options.", ["persona filter", "9-agent routing"]),
        ],
        row_cols=[2],
    ),
]


def _font_path(family: str, weight: str) -> Path:
    return FONT_ROOT / family / "files" / f"{family}-latin-{weight}-normal.woff2"


def _load_font(size: int, *, serif: bool = False, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    if serif:
        path = _font_path("newsreader", "700" if bold else "600")
    else:
        path = _font_path("dm-sans", "700" if bold else "500")
    if path.is_file():
        return ImageFont.truetype(str(path), size=size)
    fallback = "/System/Library/Fonts/Supplemental/Georgia Bold.ttf" if serif else "/Library/Fonts/Arial.ttf"
    return ImageFont.truetype(fallback, size=size)


def _load_logo(target_height: int) -> Image.Image:
    if LOGO_PNG.is_file():
        logo = Image.open(LOGO_PNG).convert("RGBA")
        scale = target_height / logo.height
        new_w = max(1, int(logo.width * scale))
        logo = logo.resize((new_w, target_height), Image.Resampling.LANCZOS)
        return logo
    cache = OUT_DIR / f".logo-h{target_height}.png"
    if not cache.exists() or cache.stat().st_mtime < LOGO_SVG.stat().st_mtime:
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            ["rsvg-convert", "-h", str(target_height), str(LOGO_SVG), "-o", str(cache)],
            check=True,
            capture_output=True,
        )
    return Image.open(cache).convert("RGBA")


def _wrap_pixels(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont, max_width: int) -> list[str]:
    words = text.split()
    if not words:
        return [""]
    lines: list[str] = []
    current: list[str] = []
    for word in words:
        trial = " ".join(current + [word])
        if draw.textlength(trial, font=font) <= max_width:
            current.append(word)
        else:
            if current:
                lines.append(" ".join(current))
            current = [word]
    if current:
        lines.append(" ".join(current))
    return lines


def _text_block_height(
    draw: ImageDraw.ImageDraw,
    text: str,
    font: ImageFont.ImageFont,
    max_width: int,
    spacing: int,
) -> int:
    lines = _wrap_pixels(draw, text, font, max_width)
    if not lines:
        return 0
    bbox = draw.multiline_textbbox((0, 0), "\n".join(lines), font=font, spacing=spacing)
    return bbox[3] - bbox[1]


def _draw_centered_block(
    draw: ImageDraw.ImageDraw,
    center_x: int,
    y: int,
    text: str,
    font: ImageFont.ImageFont,
    fill: str,
    max_width: int,
    spacing: int = 12,
) -> int:
    lines = _wrap_pixels(draw, text, font, max_width)
    for line in lines:
        w = draw.textlength(line, font=font)
        draw.text((center_x - w / 2, y), line, font=font, fill=fill)
        bbox = draw.textbbox((0, 0), line, font=font)
        y += bbox[3] - bbox[1] + spacing
    return y


def _fit_width(img: Image.Image, target_w: int) -> Image.Image:
    """Downscale only — never upscale (preserves screenshot fidelity)."""
    img = img.convert("RGB")
    if img.width <= target_w:
        return img
    scale = target_w / img.width
    new_h = max(1, int(img.height * scale))
    return img.resize((target_w, new_h), Image.Resampling.LANCZOS)


def _panel_card(screenshot: Image.Image, border: int = 2) -> Image.Image:
    w, h = screenshot.size
    card = Image.new("RGB", (w + border * 2, h + border * 2), PANEL_BORDER)
    inner = Image.new("RGB", (w, h), PANEL_BG)
    inner.paste(screenshot, (0, 0))
    card.paste(inner, (border, border))
    return card


def _draw_step_badge(draw: ImageDraw.ImageDraw, center_x: int, y: int, number: int, font: ImageFont.ImageFont) -> int:
    """Numbered badge between screenshot and caption — never overlays UI."""
    label = str(number)
    tw = draw.textlength(label, font=font)
    bbox = draw.textbbox((0, 0), label, font=font)
    th = bbox[3] - bbox[1]
    r = max(tw, th) / 2 + 18
    cx, cy = center_x, y + r
    draw.ellipse((cx - r + 2, cy - r + 3, cx + r + 2, cy + r + 3), fill="#00000014")
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=BADGE_BG, outline="#ffffff66", width=2)
    draw.text((cx - tw / 2, cy - th / 2 - 2), label, font=font, fill=BADGE_TEXT)
    return int(cy + r + 16)


def _draw_tag_row(
    draw: ImageDraw.ImageDraw,
    center_x: int,
    y: int,
    tags: list[str],
    font: ImageFont.ImageFont,
) -> int:
    if not tags:
        return y
    gap = 14
    pad_x, pad_y = 18, 10
    sizes = []
    for tag in tags:
        tw = draw.textlength(tag, font=font)
        bbox = draw.textbbox((0, 0), tag, font=font)
        th = bbox[3] - bbox[1]
        sizes.append((tag, tw, th))
    total_w = sum(tw + pad_x * 2 for _, tw, _ in sizes) + gap * (len(tags) - 1)
    x = center_x - total_w / 2
    for tag, tw, th in sizes:
        w, h = tw + pad_x * 2, th + pad_y * 2
        draw.rounded_rectangle((x, y, x + w, y + h), radius=10, fill=TAG_BG, outline=TAG_BORDER, width=1)
        draw.text((x + pad_x, y + pad_y - 2), tag, font=font, fill=TAG_TEXT)
        x += w + gap
    return y + max(h for _, _, th in sizes) + pad_y * 2 + 12


def _row_panel_widths(cols: int, inner_w: int, source_widths: list[int]) -> list[int]:
    """Per-column width: fit row inner width without upscaling any screenshot."""
    max_each = inner_w // cols
    native = min(source_widths)
    slot = min(max_each, native)
    return [slot] * cols


def _apply_crop(img: Image.Image, crop: tuple[float, float, float, float] | None) -> Image.Image:
    if not crop:
        return img
    l, t, r, b = crop
    w, h = img.size
    return img.crop((int(l * w), int(t * h), int(r * w), int(b * h)))


def _header_height(
    draw: ImageDraw.ImageDraw,
    section: Section,
    canvas_w: int,
    logo_h: int,
    title_font: ImageFont.ImageFont,
    desc_font: ImageFont.ImageFont,
) -> int:
    desc_w = canvas_w - PAD * 2
    desc_h = _text_block_height(draw, section.description, desc_font, desc_w, 16)
    section_tags_h = 56 if section.tech_tags else 0
    return 48 + logo_h + 32 + 88 + 24 + desc_h + (24 if section.tech_tags else 0) + section_tags_h + 40


def _draw_header(
    canvas: Image.Image,
    section: Section,
    canvas_w: int,
    header_h: int,
    logo_h: int,
    title_font: ImageFont.ImageFont,
    desc_font: ImageFont.ImageFont,
    section_tag_font: ImageFont.ImageFont,
) -> None:
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((0, 0, canvas_w, header_h), fill=HEADER_BG)
    draw.line((PAD, header_h - 2, canvas_w - PAD, header_h - 2), fill=HEADER_RULE, width=3)

    logo = _load_logo(logo_h)
    canvas.paste(logo, (PAD, 40), logo)
    draw.text((PAD, 40 + logo_h + 28), section.title, font=title_font, fill=TEXT_PRIMARY)

    desc_w = canvas_w - PAD * 2
    y_cursor = 40 + logo_h + 28 + 88 + 24
    for line in _wrap_pixels(draw, section.description, desc_font, desc_w):
        draw.text((PAD, y_cursor), line, font=desc_font, fill=TEXT_BODY)
        bbox = draw.textbbox((0, 0), line, font=desc_font)
        y_cursor += bbox[3] - bbox[1] + 16

    if section.tech_tags:
        y_cursor += 8
        _draw_tag_row(draw, canvas_w // 2, y_cursor, section.tech_tags, section_tag_font)


def _iter_rows(section: Section) -> list[list[Panel]]:
    rows: list[list[Panel]] = []
    i = 0
    for cols in section.row_cols:
        rows.append(section.panels[i : i + cols])
        i += cols
    return rows


def build_section(section: Section, src_dir: Path) -> Image.Image:
    logo_h = 72
    title_font = _load_font(88, serif=True, bold=True)
    desc_font = _load_font(48)
    section_tag_font = _load_font(34)
    caption_font = _load_font(52, bold=True)
    panel_tag_font = _load_font(30)
    badge_font = _load_font(44, bold=True)

    rows = _iter_rows(section)
    row_data: list[list[tuple[Panel, Image.Image, int]]] = []

    # First pass: determine native-first canvas width from widest row
    max_row_native_w = 0
    for row_panels, cols in zip(rows, section.row_cols):
        widths = []
        for panel in row_panels:
            with Image.open(src_dir / panel.file) as im:
                widths.append(im.width)
        slot = min(widths)
        row_w = PAD * 2 + cols * slot + GUTTER * (cols - 1)
        max_row_native_w = max(max_row_native_w, row_w)

    canvas_w = max_row_native_w

    tmp = Image.new("RGB", (canvas_w, 400), CANVAS_BG)
    tmp_draw = ImageDraw.Draw(tmp)

    caption_gap = 20
    badge_h = 88
    panel_tag_h = 52
    row_meta: list[dict] = []

    for row_panels, cols in zip(rows, section.row_cols):
        inner_w = canvas_w - PAD * 2 - GUTTER * (cols - 1)
        source_widths = []
        items: list[tuple[Panel, Image.Image, int]] = []
        for panel in row_panels:
            raw = Image.open(src_dir / panel.file)
            source_widths.append(raw.width)
        slot_w = min(inner_w // cols, min(source_widths))

        max_img_h = 0
        max_caption_h = 0
        max_tags_h = 0
        for panel in row_panels:
            raw = Image.open(src_dir / panel.file)
            fitted = _fit_width(raw, slot_w)
            card = _panel_card(fitted)
            items.append((panel, card, slot_w))
            max_img_h = max(max_img_h, card.height)
            ch = _text_block_height(tmp_draw, panel.label, caption_font, slot_w - 16, 14)
            max_caption_h = max(max_caption_h, ch)
            if panel.tags:
                max_tags_h = panel_tag_h

        row_meta.append(
            {
                "items": items,
                "cols": cols,
                "slot_w": slot_w,
                "img_h": max_img_h,
                "caption_h": max_caption_h,
                "tags_h": max_tags_h,
            }
        )

    desc_w = canvas_w - PAD * 2
    tmp = Image.new("RGB", (canvas_w, 400), CANVAS_BG)
    tmp_draw = ImageDraw.Draw(tmp)
    header_h = _header_height(tmp_draw, section, canvas_w, logo_h, title_font, desc_font)

    body_h = 0
    for rm in row_meta:
        body_h += rm["img_h"] + badge_h + rm["caption_h"] + rm["tags_h"] + caption_gap + 40
    body_h += GUTTER * (len(row_meta) - 1)
    canvas_h = header_h + body_h + PAD

    canvas = Image.new("RGB", (canvas_w, canvas_h), CANVAS_BG)
    _draw_header(canvas, section, canvas_w, header_h, logo_h, title_font, desc_font, section_tag_font)
    draw = ImageDraw.Draw(canvas)

    y = header_h + PAD // 2
    panel_index = 0
    for rm in row_meta:
        cols = rm["cols"]
        slot_w = rm["slot_w"]
        row_inner = cols * slot_w + GUTTER * (cols - 1)
        row_start_x = (canvas_w - row_inner) // 2

        for col, (panel, card, _) in enumerate(rm["items"]):
            x = row_start_x + col * (slot_w + GUTTER)
            cx = x + card.width // 2
            canvas.paste(card, (x, y))

            panel_index += 1
            by = _draw_step_badge(draw, cx, y + card.height + caption_gap, panel_index, badge_font)
            _draw_centered_block(draw, cx, by, panel.label, caption_font, TEXT_PRIMARY, slot_w - 8, spacing=14)
            cap_bottom = by + _text_block_height(tmp_draw, panel.label, caption_font, slot_w - 8, 14) + 8
            if panel.tags:
                _draw_tag_row(draw, cx, cap_bottom, panel.tags, panel_tag_font)

        y += rm["img_h"] + badge_h + rm["caption_h"] + rm["tags_h"] + caption_gap + 40 + GUTTER

    return canvas


def export_standalone(section: Section, src_dir: Path, out_dir: Path) -> Path:
    """Lossless copy of hero screenshot — zero resize/re-encode for Devpost gallery."""
    panel = section.panels[section.hero_panel]
    src = src_dir / panel.file
    if not src.is_file():
        raise FileNotFoundError(src)
    out = out_dir / f"standalone-{section.slug}.png"
    shutil.copy2(src, out)
    return out


def build_hero(section: Section, src_dir: Path) -> Image.Image:
    """Single-image hero — full native width, same header/caption/tags as multi-panel set."""
    logo_h = 72
    title_font = _load_font(88, serif=True, bold=True)
    desc_font = _load_font(48)
    section_tag_font = _load_font(34)
    caption_font = _load_font(52, bold=True)
    panel_tag_font = _load_font(30)

    panel = section.panels[section.hero_panel]
    path = src_dir / panel.file
    if not path.is_file():
        raise FileNotFoundError(path)

    raw = Image.open(path)
    screenshot = raw.convert("RGB")  # full frame, 1:1 native — never upscale or crop
    card = _panel_card(screenshot)

    canvas_w = card.width + PAD * 2
    caption_gap = 24
    panel_tag_h = 52 if panel.tags else 0

    tmp = Image.new("RGB", (canvas_w, 400), CANVAS_BG)
    tmp_draw = ImageDraw.Draw(tmp)
    header_h = _header_height(tmp_draw, section, canvas_w, logo_h, title_font, desc_font)
    caption_h = _text_block_height(tmp_draw, panel.label, caption_font, card.width - 16, 14)
    canvas_h = header_h + card.height + caption_gap + caption_h + panel_tag_h + caption_gap + PAD

    canvas = Image.new("RGB", (canvas_w, canvas_h), CANVAS_BG)
    _draw_header(canvas, section, canvas_w, header_h, logo_h, title_font, desc_font, section_tag_font)
    draw = ImageDraw.Draw(canvas)

    x = (canvas_w - card.width) // 2
    y = header_h + PAD // 2
    cx = canvas_w // 2
    canvas.paste(card, (x, y))

    cap_y = y + card.height + caption_gap
    _draw_centered_block(draw, cx, cap_y, panel.label, caption_font, TEXT_PRIMARY, card.width - 8, spacing=14)
    if panel.tags:
        tag_y = cap_y + caption_h + 12
        _draw_tag_row(draw, cx, tag_y, panel.tags, panel_tag_font)

    return canvas


def write_metadata(sections: list[Section], out_dir: Path) -> None:
    lines = [
        "# Iris Devpost collages (Jun 7 captures)",
        "",
        "Section montages — 1:1 screenshot fidelity, iris wordmark, centered captions, tech tags.",
        "",
        "**UI collages** tell the product story. **Diagram slices** (`diagram-01` … `diagram-04`) in gallery cover MongoDB plumbing — see [`devpost-media-matrix.md`](../devpost-media-matrix.md).",
        "",
        "Regenerate: `python3 scripts/build-devpost-collages.py`",
        "",
        "## Multi-panel collages (`collage-*.png`)",
        "",
        "Full flows — numbered steps, all screens in a section.",
        "",
        "| File | Devpost gallery title | Caption | Tech tags |",
        "|------|----------------------|---------|-----------|",
    ]
    for s in sections:
        fname = f"collage-{s.slug}.png"
        tags = ", ".join(s.tech_tags)
        lines.append(f"| `{fname}` | {s.gallery_title} | {s.gallery_caption} | {tags} |")

    lines.extend(
        [
            "",
            "## Hero singles (`hero-*.png`)",
            "",
            "One screenshot per section with cream header + tech tags (branded card).",
            "",
            "## Standalone UI (`standalone-*.png`) — **use for Devpost gallery**",
            "",
            "Byte-identical copies of source captures — maximum fidelity, no header chrome.",
            "",
            "| File | Source | Caption | Panel tech tags |",
            "|------|--------|---------|-----------------|",
        ]
    )
    for s in sections:
        hp = s.panels[s.hero_panel]
        lines.append(
            f"| `standalone-{s.slug}.png` | `{hp.file}` | {hp.label} | {', '.join(hp.tags)} |"
        )

    lines.extend(
        [
            "",
            "| File | Hero screenshot | Caption | Panel tech tags |",
            "|------|-----------------|---------|-----------------|",
        ]
    )
    for s in sections:
        hp = s.panels[s.hero_panel]
        fname = f"hero-{s.slug}.png"
        lines.append(
            f"| `{fname}` | `{hp.file}` | {hp.label} | {', '.join(hp.tags)} |"
        )

    lines.extend(
        [
            "",
            "## Recommended Devpost gallery order (hero singles)",
            "",
            "1. `standalone-02-glass-box-studio.png` — cover / thumbnail",
            "2. `standalone-01-home-memory.png`",
            "3. `standalone-05-organize-hitl.png`",
            "4. `standalone-06-my-work-library.png`",
            "5. `standalone-04-mentor-chat.png`",
            "6. `standalone-03-practice.png`",
            "7. `standalone-07-working-pro.png`",
            "",
            "Use **`collage-*`** for full multi-step story; **`standalone-*`** for gallery (max quality); **`hero-*`** if you want branded cream frame.",
            "",
            "Then add **diagram** gallery slots: architecture, agents, diagram-04-library-search.",
        ]
    )
    (out_dir / "COLLAGES.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Build Iris Devpost section collages")
    parser.add_argument("--src", type=Path, default=DEFAULT_SRC, help="Screenshot source folder")
    parser.add_argument("--out", type=Path, default=OUT_DIR, help="Output directory")
    parser.add_argument("--multi-only", action="store_true", help="Build collage-* only")
    parser.add_argument("--hero-only", action="store_true", help="Build hero-* only")
    parser.add_argument("--standalone-only", action="store_true", help="Copy standalone-* only")
    args = parser.parse_args()

    if not args.src.is_dir():
        raise SystemExit(f"Source folder not found: {args.src}")

    args.out.mkdir(parents=True, exist_ok=True)

    build_multi = not args.hero_only and not args.standalone_only
    build_hero_set = not args.multi_only and not args.standalone_only
    build_standalone_set = not args.multi_only and not args.hero_only

    if build_multi:
        for section in SECTIONS:
            collage = build_section(section, args.src)
            out_path = args.out / f"collage-{section.slug}.png"
            collage.save(out_path, format="PNG", compress_level=0)
            print(f"Wrote {out_path} ({collage.width}×{collage.height}, multi)")

    if build_standalone_set:
        for section in SECTIONS:
            out_path = export_standalone(section, args.src, args.out)
            size_mb = out_path.stat().st_size / (1024 * 1024)
            print(f"Wrote {out_path} ({size_mb:.1f} MB, lossless copy)")

    if build_hero_set:
        for section in SECTIONS:
            hero = build_hero(section, args.src)
            out_path = args.out / f"hero-{section.slug}.png"
            hero.save(out_path, format="PNG", compress_level=0)
            print(f"Wrote {out_path} ({hero.width}×{hero.height}, hero 1:1)")

    write_metadata(SECTIONS, args.out)
    print(f"Wrote {args.out / 'COLLAGES.md'}")


if __name__ == "__main__":
    main()
