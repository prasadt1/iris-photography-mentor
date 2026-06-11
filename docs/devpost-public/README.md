# Devpost public assets

Committed PNGs for Devpost **Image Gallery** and markdown `raw.githubusercontent.com` embeds.

## Section collages (Jun 7 captures)

Two UI sets + diagrams — see [`devpost-media-matrix.md`](../devpost-media-matrix.md) for gallery vs article strategy.

Regenerate UI: `python3 scripts/build-devpost-collages.py` · Diagrams: `bash scripts/export-devpost-diagrams.sh`

### Standalone UI (`standalone-*.png`) — **Devpost gallery (best quality)**

Lossless copies of Jun 7 captures — no header, no re-encode. **Upload all 7 to Image Gallery.**

| File | Screen |
|------|--------|
| `standalone-02-glass-box-studio.png` | Glass Box Overview (**cover**) |
| `standalone-01-home-memory.png` | Home dashboard |
| `standalone-05-organize-hitl.png` | Organize HITL |
| `standalone-06-my-work-library.png` | NL search |
| `standalone-04-mentor-chat.png` | Mentor reply |
| `standalone-03-practice.png` | Practice |
| `standalone-07-working-pro.png` | Print Sales |

### Branded heroes (`hero-*.png`) — optional

Same screens with cream header + tech tags (re-encoded — use standalone for max fidelity).

### Multi-panel collages (`collage-*.png`) — full flows

### Diagrams (`diagram-*.png`) — **embed in article**

From `docs/diagrams/*.mmd` — architecture, data-flow, agents, user journeys.

### Annotated splits (`annotated-*.png`) — **UI + tech in one frame**

Real Jun 7 screenshots + verified stack cards. Regenerate: `python3 scripts/build-annotated-screens.py`

| File | Use |
|------|-----|
| `annotated-05-organize.png` | MongoDB HITL — inline in Why MongoDB |
| `annotated-06-my-work.png` | Atlas Search partner track |
| `annotated-04-mentor.png` | ADK orchestrator + MCP read |
| `annotated-02-glass-box.png` | Coach agent write path |

## Legacy singles (optional inline embeds)

| File | Gallery title | Use |
|------|---------------|-----|
| `iris-landing-hero.png` | Iris — The mentor who remembers | **Marketing cover** — warm-paper landing hero (GitHub Pages) |
| `web-studio-overview.png` | Glass Box — photo + five-axis scores | Inline embed (single frame) |
| `web-studio-glassbox-tab.png` | Glass Box — why I scored it | Gallery |
| `web-home-hero.png` | Home — your library remembered | Gallery + optional inline |
| `web-mentor-organize.png` | Organize — human approval | Gallery + inline (HITL) |

Capture masters and diagrams stay in `docs/devpost-assets/` (gitignored). Re-capture landing hero: `node scripts/capture-landing-hero.mjs`

Full matrix: [`devpost-media-matrix.md`](../devpost-media-matrix.md)
