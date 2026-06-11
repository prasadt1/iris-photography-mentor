# Devpost media matrix — gallery vs article embeds

**Copy-paste article (clean):** [`devpost-article-copy-paste.md`](devpost-article-copy-paste.md)  
**Gallery upload plan:** [`devpost-gallery-upload.md`](devpost-gallery-upload.md)  
**Working draft with review notes:** [`devpost-article-draft.md`](devpost-article-draft.md)

Full asset index: [`devpost-public/COLLAGES.md`](devpost-public/COLLAGES.md) · Diagram sources: [`diagrams/*.mmd`](diagrams/) · Split-panel specs (not yet PNG): [`devpost-assets/diagram-slice-specs.md`](devpost-assets/diagram-slice-specs.md)

---

## Three asset tiers

| Tier | Files | Where | Why |
|------|-------|-------|-----|
| **A — Standalone UI** | `standalone-*.png` | **Devpost Image Gallery** (upload all 7) | Lossless source captures — max fidelity |
| **B — Branded heroes** | `hero-*.png` | Gallery optional / social | Cream header + tech tags; re-encoded |
| **C — Multi-panel** | `collage-*.png` | Gallery optional | Full step-by-step per section |
| **D — Diagrams** | `diagram-*.png` | **Article inline** + gallery | Architecture, journeys, MongoDB story |
| **E — Split UI↔plumbing** | `diagram-01` … `04` | **Not generated yet** | Generate from slice specs for MongoDB gallery |

---

## Why quality looked soft on heroes

| Cause | Fix |
|-------|-----|
| Heroes re-save PNG (header + paste) | Use **`standalone-*.png`** for gallery — byte-identical copy of your Desktop captures |
| Old `web-studio-overview.png` in article | Replace embed with **`standalone-02-glass-box-studio.png`** |
| 2480px captures on Retina | Re-capture at 2× device pixel ratio if you need sharper UI text (script picks up larger source automatically) |
| Devpost preview compresses | Gallery upload uses your file; standalone avoids double compression from collage layout |

Regenerate: `python3 scripts/build-devpost-collages.py --standalone-only`

---

## Devpost Image Gallery — upload these (12–14 slots)

### UI (7) — use `standalone-*.png`

| # | File | Gallery title | Caption |
|---|------|---------------|---------|
| G1 | `standalone-02-glass-box-studio.png` | Glass Box — five-axis scores | Gemini multimodal critique with spatial overlay on your photo. **Cover / thumbnail.** |
| G2 | `standalone-01-home-memory.png` | Home — your library remembered | Dashboard with hero frame, At a glance scores, and contact sheet. |
| G3 | `standalone-05-organize-hitl.png` | Organize — human approval | Tag/dedupe proposals — nothing applies without Approve. |
| G4 | `standalone-06-my-work-library.png` | NL search — Atlas Search | Short query → Gemini expansion → ranked results. |
| G5 | `standalone-04-mentor-chat.png` | Mentor — portfolio-aware chat | ADK orchestrator synthesis grounded in MongoDB memory. |
| G6 | `standalone-03-practice.png` | Practice — HITL assignments | AI-proposed briefs with accept/decline. |
| G7 | `standalone-07-working-pro.png` | Print Sales — HITL listings | Marketplace drafts await explicit approval. |

### Diagrams (5–7) — also embed key ones in article

| # | File | Gallery title | Caption |
|---|------|---------------|---------|
| G8 | `diagram-architecture.png` | System architecture | Web + iOS → Cloud Run → ADK → Gemini + MongoDB Atlas. |
| G9 | `diagram-data-flow.png` | Critique pipeline | Upload → Coach → Glass Box write → portfolio + vector index. |
| G10 | `diagram-agent-orchestration.png` | Nine ADK agents | Persona-filtered orchestrator routing. |
| G11 | `diagram-user-journey-hobbyist.png` | Hobbyist journey | Upload → critique → practice → reflection loop. |
| G12 | `diagram-user-journey-pro.png` | Working pro journey | Memory + Organize + Print Sales path. |
| G13 | `collage-06-my-work-library.png` | My Work — full flow | Gallery + search + similar photos (optional if slots remain) |
| G14 | `collage-02-glass-box-studio.png` | Glass Box — full flow | In-progress → Overview → Glass Box → How to fix (optional) |

Export diagrams: `bash scripts/export-devpost-diagrams.sh`

---

## Annotated split panels (`annotated-*.png`) — **corrected UI + tech**

Regenerate from Jun 7 captures: `python3 scripts/build-annotated-screens.py`

Claude Cowork mockups used **stale/wrong UI** (fake browser frames, Organize-1 without thumbnails, wrong Mentor state). These replacements use **real screenshots** + **verified API/agent labels** from `app/api/server.py`.

| File | Real screenshot | Fix vs Cowork mock |
|------|-----------------|-------------------|
| `annotated-01-home.png` | `Iris-Home-1.png` | Real horse hero + contact sheet |
| `annotated-02-glass-box.png` | `Iris-photo-analysis-result-1.png` | Real sunset Glass Box overview |
| `annotated-03-practice.png` | `Iris-practice.png` | Real HITL assignments UI |
| `annotated-04-mentor.png` | `Iris-Mentor-Chat-Result.png` | Real chat reply (not fake progress text) |
| `annotated-05-organize.png` | **`Iris-Organize-2.png`** | **Photo thumbnails + Yes/No** (not history-only) |
| `annotated-06-my-work.png` | `Iris-My-Work-3-Search.png` | Real NL search results |
| `annotated-07-print.png` | `Iris-Print-Sales.png` | Real listing drafts UI |

**Article embeds (MongoDB / How I built it):** use `annotated-05-organize`, `annotated-06-my-work`, `annotated-04-mentor` — one split panel beats three UI screenshots.

**Gallery:** upload annotated set *or* standalone set — don't duplicate both unless you have gallery slots to spare.

---

## Article inline embeds — paste exactly these (4 images)

Devpost needs **public URLs** after git push. Base:

`https://raw.githubusercontent.com/prasadt1/iris-photography-mentor/main/docs/devpost-public/`

| # | Section | File | Purpose |
|---|---------|------|---------|
| **1** | What it does | `standalone-02-glass-box-studio.png` | One UI wow — replaces stale `web-studio-overview.png` |
| **2** | How I built it (top) | `diagram-architecture.png` | System stack for all judges |
| **3** | How I built it (after Coach) | `diagram-data-flow.png` | Critique write path |
| **4** | Why MongoDB (partner track) | `diagram-user-journey-hobbyist.png` OR generate `diagram-04-library-search` | Journey + memory loop; swap #4 for NL-search split when generated |

**Do not inline:** all 7 UI screenshots, collage montages, or more than 4 images total.

### Copy-paste blocks (after push to `main`)

**What it does** — replace old Glass Box embed:

```markdown
![Glass Box — five-axis scores on your photo](https://raw.githubusercontent.com/prasadt1/iris-photography-mentor/main/docs/devpost-public/standalone-02-glass-box-studio.png)

*Gallery title:* **Glass Box — five-axis scores** · *Caption:* Multimodal Coach with inspectable reasoning — upload the same PNG to Image Gallery.*
```

**How I built it** — after the nine-agent table intro:

```markdown
![System architecture — Cloud Run, ADK, Gemini, MongoDB Atlas](https://raw.githubusercontent.com/prasadt1/iris-photography-mentor/main/docs/devpost-public/diagram-architecture.png)

![Critique pipeline — upload to portfolio write](https://raw.githubusercontent.com/prasadt1/iris-photography-mentor/main/docs/devpost-public/diagram-data-flow.png)
```

**Why MongoDB** — after the five-primitives table:

```markdown
![Hobbyist journey — memory-first loop](https://raw.githubusercontent.com/prasadt1/iris-photography-mentor/main/docs/devpost-public/diagram-user-journey-hobbyist.png)
```

---

## Split-panel UI ↔ plumbing diagrams

**Good for MongoDB track** — left: real UI screenshot, right: MCP / Atlas path. Specs in [`devpost-assets/diagram-slice-specs.md`](devpost-assets/diagram-slice-specs.md); prompts in [`devpost-assets/gemini-chatgpt-diagram-prompts.md`](devpost-assets/gemini-chatgpt-diagram-prompts.md).

| Priority | Spec | Status | Article vs gallery |
|----------|------|--------|-------------------|
| ⭐ | Diagram 4 — NL library search | **Not generated** | Inline in **Why MongoDB** (best partner proof) |
| ⭐ | Diagram 2 — Coach write path | **Not generated** | Gallery only |
| ⭐ | Diagram 3 — Vector similar | **Not generated** | Gallery only |
| | Diagram 1 — My Work MCP read | **Not generated** | Gallery only |

**Recommendation:** Generate **diagram-04** (UI search bar + Atlas Search flow) and embed **only that one** split diagram in the MongoDB section. Keep other splits in gallery. Do **not** put split diagrams in Inspiration.

---

## What we have vs need

| Asset | Status | Location |
|-------|--------|----------|
| Jun 7 UI captures | ✅ | Desktop → `standalone-*.png` |
| Cream heroes + collages | ✅ | `hero-*.png`, `collage-*.png` |
| Architecture / agents / data-flow / journeys | ✅ **generated** | `diagram-*.png` from `docs/diagrams/*.mmd` |
| Split UI↔plumbing (01–04) | ❌ **need generation** | Specs only — use Gemini prompts |
| MCP trace screenshot | ❓ optional | Capture from Cloud Trace if available |
| Demo video | ❌ required | — |

---

## Minimum viable Devpost submit

- Cover: crop `standalone-02-glass-box-studio.png`
- Gallery: 7 `standalone-*` + 3–4 `diagram-*`
- Video: ~3 min
- Article: 4 inline images (1 UI + 3 diagrams) per table above

---

*Last updated: Jun 8, 2026*
