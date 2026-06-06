# Devpost media matrix — gallery vs article embeds

**Rule of thumb:** Judges skim **gallery + video** first. The written story gets **2–3 inline UI images max**; everything else lives in the **Image Gallery** with title + caption per slot.

**Do not** embed diagram slices (UI + plumbing) in Inspiration — they read as engineering docs. Put those in **How I built it** or gallery only.

---

## How many assets total?

| Bucket | Count | Where |
|--------|------:|--------|
| **Cover / thumbnail** | 1 | Devpost cover (512² or 16:9 crop) |
| **Gallery (required feel)** | **5–8** | Devpost Image Gallery — each needs **title + caption** |
| **Article inline embeds** | **2–3** | Markdown in story — wow moments only |
| **Diagrams (architecture)** | 2 | Gallery + optional one inline in How I built it |
| **Diagram slices (01–04)** | 0–2 inline | Gallery or MongoDB section only — not both |
| **iPhone + MCP trace** | 0–2 | Gallery if you have them; video covers mobile |
| **Demo video** | 1 | Required |

**Minimum viable submit:** cover + 5 gallery + video + 2 inline in article.

---

## Gallery vs inline (recommended)

| # | File (target) | Title (Devpost gallery) | Caption | Gallery | Inline in article |
|---|---------------|-------------------------|---------|:-------:|:-------------------:|
| G0 | `hero-cover.png` or composite | Iris — AI Photography Mentor | One mentor, web studio + MongoDB memory. | ✅ cover | — |
| G1 | `web-home-hero.png` | Home — your library remembered | Best frame, At a glance scores, contact sheet. | ✅ | ✅ *Inspiration or What it does* |
| G2 | **`web-studio-overview.png`** | Glass Box — photo + five-axis scores | Full critique layout: your photo, score breakdown, scene description. | ✅ | ✅ *What it does* (replaces bad glassbox crop) |
| G3 | `web-studio-glassbox-tab.png` | Glass Box — why I scored it | Inspectable reasoning tab; grounded principles. | ✅ | optional |
| G4 | `web-mentor-organize.png` | Organize — human approval | HITL tag/dedupe proposals; nothing auto-applies. | ✅ | ✅ *How I built it* (HITL) |
| G5 | `web-mywork-search.png` | Library search | NL query → Atlas Search on same corpus as vectors. | ✅ | — |
| G6 | `diagram-architecture.png` | System architecture | Web + iOS → Cloud Run → ADK → Gemini + Atlas. | ✅ | optional in How I built it |
| G7 | `diagram-agents.png` | Nine ADK agents | Persona-filtered orchestrator tool lists. | ✅ | — |
| G8 | `diagram-04-library-search.png` | NL search pipeline | Gemini expansion → Atlas Search (partner track). | optional | link in [Why MongoDB](#why-mongodb-for-partner-track) only |
| G9 | `web-print-sales.png` | Print Sales (working pro) | Marketplace drafts behind HITL. | optional | — |
| G10 | `mcp-cloud-trace.png` | MongoDB MCP in production | OpenTelemetry spans — judge-verifiable reads. | ✅ MongoDB | — |
| G11 | `ios-critique-radar.png` | iPhone field critique | Same Glass Box memory on device. | if recorded | — |

**Retire for Devpost:** `web-studio-glassbox.png` (old full-viewport crop — photo tiny, analysis cut off).

---

## Diagram slices (01–04) — gallery only, not article body

These are **left/right plumbing diagrams** — great for MongoDB partner judges in **gallery** or a collapsed “Technical deep dives” subsection. Do **not** use as the first inline image.

| File | Gallery title | Caption |
|------|---------------|---------|
| `diagram-01-mywork-mcp.png` | My Work read path | GET /portfolio → MCP → `portfolio_entries` |
| `diagram-02-glassbox-coach.png` | Upload → Coach write | Gemini critique → GCS + portfolio write |
| `diagram-03-vector-similar.png` | Similar photos | Atlas Vector Search on embeddings |
| `diagram-04-library-search.png` | NL library search | Gemini expansion → `glass_box_search` |

---

## Article inline embed budget (copy-paste section)

Paste **at most 3** images into the story body:

1. **Home** — proves memory/dashboard (`web-home-hero.png`)
2. **Glass Box overview** — proves product wow (`web-studio-overview.png`)
3. **Organize HITL** — proves agentic + human gate (`web-mentor-organize.png`)

Use GitHub raw URLs under `docs/devpost-public/` after commit. Diagrams: **gallery only** unless one architecture PNG in How I built it.

---

## Capture fixes (Glass Box)

Old capture: full viewport while scrolled → photo small, tabs cut off.

**New captures:**

| File | How |
|------|-----|
| `web-studio-overview.png` | After upload → **Overview** tab → element screenshot of photo + score grid (`lg:grid-cols-12`) |
| `web-studio-glassbox-tab.png` | **Why I scored it** tab → element screenshot of right panel + visible photo column |

Re-run: `node docs/devpost-assets/capture-web-screenshots.mjs --force`

---

## Devpost gallery upload checklist

For each image in the gallery UI, fill:

- **Title** — from “Gallery title” column above (short, judge-scannable)
- **Description** — from “Caption” column (one sentence, no jargon stack)

---

*Last updated: Jun 6, 2026*
