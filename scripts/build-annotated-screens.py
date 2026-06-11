#!/usr/bin/env python3
"""Build annotated UI + tech-stack split panels (Devpost / article embeds)."""

from __future__ import annotations

import subprocess
import textwrap
from dataclasses import dataclass, field
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SRC = Path.home() / "Desktop" / "Iris-Screenshots-Latest-Jun-7"
OUT_DIR = ROOT / "docs" / "devpost-public"
FONT_ROOT = ROOT / "frontend" / "node_modules" / "@fontsource"
LOGO_DARK_SVG = ROOT / "frontend" / "public" / "iris-wordmark-dark.svg"

# Dark theater palette (matches agent-theater.html)
BG = "#1a1816"
BG_PANEL = "#16140f"
AMBER = "#f59e0b"
AMBER_LIGHT = "#fbbf24"
CREAM = "#e7e5e4"
CREAM_MID = "#a8a29e"
CREAM_DIM = "#78716c"
MONGO = "#47A248"
GOOGLE = "#4285F4"
BORDER = "#44403c"

CANVAS_W = 3840
CANVAS_H = 2160
PAD = 56
LEFT_RATIO = 0.58  # UI screenshot gets majority of width (was 0.44 — too small to read)


@dataclass
class TechCard:
    label: str
    title: str
    detail: str
    accent: str = "default"  # default | amber | mongo | google


@dataclass
class AnnotatedScreen:
    slug: str
    screen_tag: str
    title: str
    screenshot: str
    url: str
    caption_title: str
    caption_body: str
    footer_tags: list[str]
    footer_note: str
    cards: list[TechCard]
    # Normalized crop (l, t, r, b) — trims dark nav sidebar + focuses hero/content.
    focus_crop: tuple[float, float, float, float] | None = None


SCREENS: list[AnnotatedScreen] = [
    AnnotatedScreen(
        slug="01-home",
        screen_tag="SCREEN 01 · MEMORY",
        title="Home",
        screenshot="Iris-Home-1.png",
        url="iris-photo-mentor.web.app/",
        caption_title="Home — your library, remembered",
        caption_body=(
            "Best-in-library hero, At a glance scores, recent trend, and contact sheet — "
            "all derived from portfolio memory, not a one-shot critique."
        ),
        footer_tags=["Persistent memory", "MCP read", "on-read profile", "Persona: all"],
        footer_note="Reads: MongoDB MCP · Writes: PyMongo on upload (portfolio_entries)",
        focus_crop=(0.12, 0.0, 1.0, 0.72),  # main column: hero + At a glance (skip contact sheet)
        cards=[
            TechCard("FRONTEND", "React + Vite", "Firebase Hosting · hero · trend cards · contact sheet"),
            TechCard("API", "FastAPI on Cloud Run", "GET /api/v1/portfolio · /portfolio/trends · /portfolio/stats"),
            TechCard("PROTOCOL", "MongoDB MCP Server", "mongodb.mcp.find / aggregate (Cloud Trace ✓)", "mongo"),
            TechCard("MONGODB ATLAS · PARTNER", "portfolio_entries + profiles", "documents · on-read skill profiles", "mongo"),
            TechCard("STORAGE", "Cloud Storage", "GCS signed URLs for thumbnails + originals"),
        ],
    ),
    AnnotatedScreen(
        slug="02-glass-box",
        screen_tag="SCREEN 02 · CORE AGENT",
        title="Glass Box — Studio",
        screenshot="Iris-photo-analysis-result-1.png",
        url="iris-photo-mentor.web.app/studio",
        caption_title="Glass Box — multimodal critique you can inspect",
        caption_body=(
            "Coach scores five axes with spatial pins, scene description, and grounded principles — "
            "structured JSON write to portfolio memory."
        ),
        footer_tags=["Coach agent", "Gemini 3.1 Pro", "Agent Builder", "Persona: all"],
        footer_note="Writes: PyMongo — scores, tags, embedding → portfolio_entries + GCS",
        focus_crop=(0.12, 0.0, 1.0, 0.88),
        cards=[
            TechCard("FRONTEND", "React + Vite", "upload · score panel · spatial pin overlay"),
            TechCard("API", "FastAPI on Cloud Run", "POST /api/v1/analyze-photo"),
            TechCard("AGENT · 1 OF 9", "Coach (Google ADK)", "Gemini 3.1 Pro multimodal critique", "amber"),
            TechCard("GROUNDING", "Agent Builder Data Store", "search_photography_principles · ~50 docs"),
            TechCard("MONGODB ATLAS · PARTNER", "Writes portfolio_entries", "scores · tags · vector embedding", "mongo"),
            TechCard("STORAGE + MODEL", "GCS + Gemini 3.1 Pro", "original image in GCS · critique JSON", "google"),
        ],
    ),
    AnnotatedScreen(
        slug="03-practice",
        screen_tag="SCREEN 03 · HITL",
        title="Practice",
        screenshot="Iris-practice.png",
        url="iris-photo-mentor.web.app/practice",
        caption_title="Practice — assignments that target your weak spots",
        caption_body=(
            "Planner proposes a focused brief from portfolio gaps; you accept or pass. "
            "Reflection computes skill delta when you complete the shoot."
        ),
        footer_tags=["Planner", "Reflection", "HITL accept/pass", "assignments"],
        footer_note="Reads: MongoDB MCP · Writes: PyMongo (assignments collection)",
        focus_crop=(0.12, 0.0, 1.0, 0.85),
        cards=[
            TechCard("FRONTEND", "React + Vite", "proposal card · accept / pass · reflection"),
            TechCard("API", "FastAPI on Cloud Run", "POST /assignments/propose · /accept · /complete"),
            TechCard("AGENTS · 2 OF 9", "Planner + Reflection", "propose brief · compute skill delta", "amber"),
            TechCard("PROTOCOL", "MongoDB MCP Server", "reads recent entries to find gaps", "mongo"),
            TechCard("MONGODB ATLAS · PARTNER", "assignments collection", "HITL state · accept / pass", "mongo"),
            TechCard("MODEL", "Gemini 3.1 Pro", "reasons over portfolio history", "google"),
        ],
    ),
    AnnotatedScreen(
        slug="04-mentor",
        screen_tag="SCREEN 04 · ORCHESTRATION",
        title="Mentor",
        screenshot="Iris-Mentor-Chat-Result.png",
        url="iris-photo-mentor.web.app/mentor",
        caption_title="Mentor — portfolio-aware coaching chat",
        caption_body=(
            "ADK Orchestrator delegates to sub-agents while grounding replies in MongoDB memory — "
            "not generic chat; reads portfolio + aesthetic profile via MCP."
        ),
        footer_tags=["Orchestrator", "MCP read", "portfolio-grounded", "Persona: all"],
        footer_note="Reads: MongoDB MCP · Chat session in-memory on Cloud Run (demo)",
        focus_crop=(0.12, 0.0, 1.0, 0.85),
        cards=[
            TechCard("FRONTEND", "React + Vite", "chat · suggested questions · voiceover"),
            TechCard("API", "FastAPI on Cloud Run", "POST /api/v1/agent/chat"),
            TechCard("AGENT · GOOGLE ADK", "Orchestrator → Mentor", "delegates per intent · 9 LlmAgents", "amber"),
            TechCard("PROTOCOL", "MongoDB MCP Server", "mongodb.mcp.find / aggregate (Cloud Trace ✓)", "mongo"),
            TechCard("MONGODB ATLAS · PARTNER", "portfolio_entries + aesthetic_profile", "grounded synthesis", "mongo"),
            TechCard("MODEL", "Gemini 3.1 Pro", "portfolio-aware bullet reply", "google"),
        ],
    ),
    AnnotatedScreen(
        slug="05-organize",
        screen_tag="SCREEN 05 · HITL",
        title="Organize",
        screenshot="Iris-Organize-2.png",
        url="iris-photo-mentor.web.app/mentor/organize",
        caption_title="Organize — every bulk change waits for your approval",
        caption_body=(
            "Triage clusters similar shots and proposes tags with photo thumbnails — "
            "Yes/No gate before anything writes to your library."
        ),
        footer_tags=["Triage", "HITL approve", "pending_approvals", "Persona: hobbyist+pro"],
        footer_note="No autonomous tag apply · approved changes write via PyMongo",
        focus_crop=(0.12, 0.0, 1.0, 0.85),
        cards=[
            TechCard("FRONTEND", "React + Vite", "scan · thumbnail proposals · approve / reject"),
            TechCard("API", "FastAPI on Cloud Run", "POST /api/v1/triage/scan · /triage/backlog"),
            TechCard("AGENT · 1 OF 9", "Triage (Google ADK)", "clusters shots · proposes harmonized tags", "amber"),
            TechCard("PROTOCOL", "MongoDB MCP Server", "reads library for clustering", "mongo"),
            TechCard("MONGODB ATLAS · PARTNER", "pending_approvals (HITL gate)", "approve / reject · no autonomous writes", "mongo"),
            TechCard("MODEL", "Gemini 3.1 Pro", "similarity + tag harmonization reasoning", "google"),
        ],
    ),
    AnnotatedScreen(
        slug="06-my-work",
        screen_tag="SCREEN 06 · MONGODB TRACK",
        title="My Work",
        screenshot="Iris-My-Work-3-Search.png",
        url="iris-photo-mentor.web.app/my-work",
        caption_title="My Work — your portfolio, remembered & searchable",
        caption_body=(
            "Natural-language query expanded by Gemini → Atlas Search on the same corpus "
            "that powers vector similar photos."
        ),
        footer_tags=["Atlas Search", "Vector Search", "MCP read", "Persona: all"],
        footer_note="Reads: MongoDB MCP · Search: glass_box_search index · Vectors: embeddings",
        focus_crop=(0.12, 0.0, 1.0, 0.85),
        cards=[
            TechCard("FRONTEND", "React + Vite", "gallery grid · NL search bar · expand tile"),
            TechCard("API", "FastAPI on Cloud Run", "GET /portfolio · GET /portfolio/search"),
            TechCard("QUERY EXPANSION", "Gemini 3.1 Pro", "short query → Atlas Search keywords", "google"),
            TechCard("PROTOCOL", "MongoDB MCP Server", "mongodb.mcp.find / aggregate (Cloud Trace ✓)", "mongo"),
            TechCard("MONGODB ATLAS · PARTNER", "Atlas Search + Vector Search", "$search full-text · $vectorSearch similar", "mongo"),
            TechCard("STORAGE", "Cloud Storage + embeddings", "GCS URLs · 1408-d multimodal vectors"),
        ],
    ),
    AnnotatedScreen(
        slug="07-print",
        screen_tag="SCREEN 07 · WORKING PRO",
        title="Print Sales",
        screenshot="Iris-Print-Sales.png",
        url="iris-photo-mentor.web.app/print-sales",
        caption_title="Print Sales — AI-drafted listings, human-approved",
        caption_body=(
            "Print Sales Strategist drafts marketplace copy from strong portfolio candidates — "
            "working-pro persona only; publish stays behind HITL."
        ),
        footer_tags=["Print Sales", "Persona: working pro", "HITL publish", "pending_approvals"],
        footer_note="Working-pro persona only · approved listings saved locally, not Etsy API",
        focus_crop=(0.12, 0.0, 1.0, 0.85),
        cards=[
            TechCard("FRONTEND", "React + Vite", "listing proposal cards · per-card approve"),
            TechCard("API", "FastAPI on Cloud Run", "POST /api/v1/print-sales/scan"),
            TechCard("AGENT · 1 OF 9", "Print Sales Strategist", "drafts title · description · price", "amber"),
            TechCard("PROTOCOL", "MongoDB MCP Server", "reads strong print candidates", "mongo"),
            TechCard("MONGODB ATLAS · PARTNER", "pending_approvals (publish gate)", "per-card approve before save", "mongo"),
            TechCard("MODEL", "Gemini 3.1 Pro", "marketplace listing copy", "google"),
        ],
    ),
]


def _font_path(family: str, weight: str) -> Path:
    return FONT_ROOT / family / "files" / f"{family}-latin-{weight}-normal.woff2"


def _load_font(size: int, *, mono: bool = False, bold: bool = False) -> ImageFont.FreeTypeFont:
    if mono:
        # JetBrains not bundled — use system mono
        path = "/System/Library/Fonts/SFNSText.ttf"
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            return ImageFont.truetype("/Library/Fonts/Arial.ttf", size=size)
    path = _font_path("dm-sans", "700" if bold else "500")
    if path.is_file():
        return ImageFont.truetype(str(path), size=size)
    return ImageFont.truetype("/Library/Fonts/Arial.ttf", size=size)


def _load_logo(height: int) -> Image.Image:
    cache = OUT_DIR / f".logo-dark-h{height}.png"
    if not cache.exists() or cache.stat().st_mtime < LOGO_DARK_SVG.stat().st_mtime:
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            ["rsvg-convert", "-h", str(height), str(LOGO_DARK_SVG), "-o", str(cache)],
            check=True,
            capture_output=True,
        )
    return Image.open(cache).convert("RGBA")


def _accent_colors(accent: str) -> tuple[str, str | None]:
    if accent == "amber":
        return AMBER, AMBER
    if accent == "mongo":
        return MONGO, MONGO
    if accent == "google":
        return GOOGLE, GOOGLE
    return BORDER, None


def _draw_round_rect(draw: ImageDraw.ImageDraw, xy: tuple, radius: int, fill: str, outline: str | None = None, width: int = 1) -> None:
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def _apply_crop(img: Image.Image, crop: tuple[float, float, float, float] | None) -> Image.Image:
    if not crop:
        return img
    l, t, r, b = crop
    w, h = img.size
    return img.crop((int(l * w), int(t * h), int(r * w), int(b * h)))


def _fill_in_box(img: Image.Image, w: int, h: int) -> Image.Image:
    """Scale to cover the box (crop overflow) — maximizes readable UI text."""
    img = img.convert("RGB")
    scale = max(w / img.width, h / img.height)
    nw, nh = max(1, int(img.width * scale)), max(1, int(img.height * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - w) // 2
    top = (nh - h) // 2
    return resized.crop((left, top, left + w, top + h))


def _fit_in_box(img: Image.Image, w: int, h: int) -> Image.Image:
    img = img.convert("RGB")
    scale = min(w / img.width, h / img.height)
    nw, nh = max(1, int(img.width * scale)), max(1, int(img.height * scale))
    resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (w, h), BG_PANEL)
    canvas.paste(resized, ((w - nw) // 2, (h - nh) // 2))
    return canvas


def _draw_browser_frame(base: Image.Image, xy: tuple[int, int, int, int], screenshot: Image.Image, url: str, fonts: dict) -> None:
    x0, y0, x1, y1 = xy
    draw = ImageDraw.Draw(base)
    _draw_round_rect(draw, (x0, y0, x1, y1), 14, BG_PANEL, BORDER, 2)
    bar_h = 32
    _draw_round_rect(draw, (x0 + 1, y0 + 1, x1 - 1, y0 + bar_h), 13, "#242120")
    for i, c in enumerate(["#ef4444", "#f59e0b", "#22c55e"]):
        draw.ellipse((x0 + 14 + i * 18, y0 + 10, x0 + 24 + i * 18, y0 + 20), fill=c)
    url_w = x1 - x0 - 96
    url_x = x0 + 72
    _draw_round_rect(draw, (url_x, y0 + 6, url_x + url_w, y0 + bar_h - 6), 8, "#1a1816", BORDER, 1)
    draw.text((url_x + 12, y0 + 8), url, font=fonts["url"], fill=CREAM_DIM)
    inner_x, inner_y = x0 + 4, y0 + bar_h + 2
    inner_w, inner_h = x1 - x0 - 8, y1 - y0 - bar_h - 6
    fitted = _fill_in_box(screenshot, inner_w, inner_h)
    base.paste(fitted, (inner_x, inner_y))


def _draw_tech_card(
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    w: int,
    card: TechCard,
    fonts: dict,
) -> int:
    pad = 22
    label_font = fonts["card_label"]
    title_font = fonts["card_title"]
    detail_font = fonts["card_detail"]
    lh_label = 28
    lh_title = 36
    detail_lines = textwrap.wrap(card.detail, width=52)
    lh_detail = 26
    h = pad * 2 + lh_label + 8 + lh_title + 8 + max(lh_detail, len(detail_lines) * lh_detail)
    border, glow = _accent_colors(card.accent)
    fill = "#211f1c" if card.accent == "default" else "#1f1d18"
    _draw_round_rect(draw, (x, y, x + w, y + h), 12, fill, border if glow else BORDER, 2 if glow else 1)
    if glow:
        draw.rectangle((x, y + 8, x + 5, y + h - 8), fill=glow)
    ty = y + pad
    draw.text((x + pad + (8 if glow else 0), ty), card.label, font=label_font, fill=CREAM_DIM if card.accent == "default" else glow)
    ty += lh_label + 8
    draw.text((x + pad + (8 if glow else 0), ty), card.title, font=title_font, fill=CREAM)
    ty += lh_title + 8
    for line in detail_lines:
        draw.text((x + pad + (8 if glow else 0), ty), line, font=detail_font, fill=CREAM_MID)
        ty += lh_detail
    return h + 14


def build_screen(screen: AnnotatedScreen, src_dir: Path) -> Image.Image:
    fonts = {
        "badge": _load_font(22, mono=True),
        "screen_tag": _load_font(24, mono=True),
        "title": _load_font(72, bold=True),
        "section": _load_font(26, mono=True),
        "caption_title": _load_font(48, bold=True),
        "caption_body": _load_font(32),
        "tag": _load_font(24, mono=True),
        "footer": _load_font(22, mono=True),
        "url": _load_font(22, mono=True),
        "card_label": _load_font(22, mono=True),
        "card_title": _load_font(34, bold=True),
        "card_detail": _load_font(26, mono=True),
    }

    canvas = Image.new("RGB", (CANVAS_W, CANVAS_H), BG)
    draw = ImageDraw.Draw(canvas)

    logo = _load_logo(48)
    canvas.paste(logo, (PAD, PAD - 4), logo)
    badge_x = PAD + logo.width + 20
    draw.text((badge_x, PAD + 8), "GLASS BOX · AI PHOTO MENTOR", font=fonts["badge"], fill=AMBER)

    title_w = draw.textlength(screen.title, font=fonts["title"])
    draw.text((CANVAS_W - PAD - title_w, PAD - 8), screen.title, font=fonts["title"], fill=CREAM)
    tag_w = draw.textlength(screen.screen_tag, font=fonts["screen_tag"])
    draw.text((CANVAS_W - PAD - tag_w, PAD + 64), screen.screen_tag, font=fonts["screen_tag"], fill=CREAM_DIM)

    left_x0 = PAD
    left_w = int(CANVAS_W * LEFT_RATIO)
    right_x0 = left_x0 + left_w + 40
    right_w = CANVAS_W - PAD - right_x0
    top_y = 140
    browser_y1 = CANVAS_H - 300

    shot_path = src_dir / screen.screenshot
    if not shot_path.is_file():
        raise FileNotFoundError(shot_path)
    screenshot = _apply_crop(Image.open(shot_path), screen.focus_crop)
    _draw_browser_frame(canvas, (left_x0, top_y, left_x0 + left_w, browser_y1), screenshot, screen.url, fonts)

    draw.text((right_x0, top_y), "UNDER THE HOOD · FRONT → BACK", font=fonts["section"], fill=AMBER)
    cy = top_y + 48
    for card in screen.cards:
        ch = _draw_tech_card(draw, right_x0, cy, right_w, card, fonts)
        cy += ch

    foot_y = CANVAS_H - 250
    draw.text((left_x0, foot_y), screen.caption_title, font=fonts["caption_title"], fill=CREAM)
    body_lines = textwrap.wrap(screen.caption_body, width=58)
    by = foot_y + 58
    for line in body_lines:
        draw.text((left_x0, by), line, font=fonts["caption_body"], fill=CREAM_MID)
        by += 38

    tx = right_x0
    ty = CANVAS_H - 100
    for tag in screen.footer_tags:
        tw = draw.textlength(tag, font=fonts["tag"]) + 28
        accent = AMBER if "Persona" in tag or tag in ("Coach agent", "Print Sales", "Orchestrator") else BORDER
        _draw_round_rect(draw, (tx, ty, tx + tw, ty + 38), 10, "#211f1c", accent, 1)
        draw.text((tx + 14, ty + 8), tag, font=fonts["tag"], fill=CREAM if accent == AMBER else CREAM_MID)
        tx += tw + 12
    draw.text((right_x0, CANVAS_H - 52), screen.footer_note, font=fonts["footer"], fill=CREAM_DIM)

    return canvas


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Build annotated UI + tech split panels")
    parser.add_argument("--src", type=Path, default=DEFAULT_SRC)
    parser.add_argument("--out", type=Path, default=OUT_DIR)
    args = parser.parse_args()

    if not args.src.is_dir():
        raise SystemExit(f"Source not found: {args.src}")
    args.out.mkdir(parents=True, exist_ok=True)

    for s in SCREENS:
        img = build_screen(s, args.src)
        out = args.out / f"annotated-{s.slug}.png"
        img.save(out, format="PNG", compress_level=1)
        print(f"Wrote {out} ({img.width}×{img.height})")


if __name__ == "__main__":
    main()
