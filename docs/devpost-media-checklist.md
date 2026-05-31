# Devpost media & diagram checklist

**Goal:** Everything needed to submit Iris on Devpost — video, gallery images, diagrams, and captions.  
**Live URLs:** Web https://practice-companion-hackathon.web.app · API https://practice-companion-api-l6kusl5xcq-uc.a.run.app/health  
**Copy:** [`devpost-article-draft.md`](devpost-article-draft.md) · Short fields [`devpost-draft.md`](devpost-draft.md) · AI/diagram prompts [`devpost-visual-prompts.md`](devpost-visual-prompts.md)

---

## Submission slots (Devpost form)

| Slot | Required? | Status | Asset |
|------|-----------|--------|--------|
| **Demo video** | Yes (heavily weighted) | ☐ | YouTube/Vimeo unlisted, ≤3 min judged |
| **Cover / thumbnail** | Yes | ☐ | 512×512 or 16:9 hero — see §Cover |
| **Gallery images** | 3–5 recommended | ☐ | Real app screenshots only — §Screenshots |
| **Architecture diagram** | Recommended | ☐ | Export §Diagrams |
| **GitHub link** | Yes | ✅ | https://github.com/prasadt1/photography-practice-companion |
| **Try it out URL** | Yes | ✅ | https://practice-companion-hackathon.web.app |
| **Written story** | Yes | ☐ | Paste from `devpost-article-draft.md` after final read |

---

## 1. Demo video (~3 min)

**Script:** [`demo-video-script-3min.md`](demo-video-script-3min.md) (web + iPhone beats)  
**Short iPhone B-roll:** [`ios-demo-video-script.md`](ios-demo-video-script.md)

### Before recording

- [ ] Prod QA once on demo mode (hobbyist path)
- [ ] Portfolio has ≥6 photos for Home growth / trends
- [ ] One working-pro listing in **Your approved listings** (optional pro beat)
- [ ] iPhone on device with Iris built from `main` (horizon + radar tested)
- [ ] Do Not Disturb; hide personal notifications

### Capture checklist

| Time | Surface | Show |
|------|---------|------|
| 0:00–0:20 | Web Home | Layered dashboard, At a glance, pitch |
| 0:20–0:50 | Web Studio | Upload → Glass Box → spatial overlay toggle |
| 0:50–1:10 | Web Practice | Proposed assignment → Accept → View details |
| 1:10–1:30 | Web My Work | Search bar, similar photos row, delete (optional) |
| 1:30–1:50 | Web Mentor | Chat + action chip → Organize → HITL approve |
| 1:50–2:15 | iPhone Shoot | Horizon line + live coach cue + critique radar |
| 2:15–2:35 | Web Settings or terminal | Theme toggle **or** `./scripts/verify_mcp_in_production.sh` log line |
| 2:35–2:55 | End card | URLs + tagline |

- [ ] Export 1080p or 4K, upload unlisted
- [ ] Paste video URL into Devpost + `devpost-article-draft.md` Try it out table

---

## 2. Screenshots (real UI only)

Capture at **1440×900** (web) or **1290×2796** (iPhone 15 Pro) — PNG, no browser chrome if possible.

| # | File name (suggested) | Route | What judges should see |
|---|------------------------|-------|-------------------------|
| S1 | `web-home-dark.png` | `/` Home | Trends, recent photos, active practice |
| S2 | `web-studio-glassbox.png` | Studio after upload | Glass Box tab, scores, spatial pins |
| S3 | `web-practice-detail.png` | Practice → View details | Assignment brief + compare link |
| S4 | `web-mywork-search.png` | My Work | NL search + similar photos row |
| S5 | `web-mentor-organize.png` | Mentor → Organize | HITL card + history panel |
| S6 | `web-print-sales.png` | Print Sales (working pro) | Trust banner + approved listings |
| S7 | `web-theme-light.png` | Settings → light mode | Optional — shows E6 polish |
| S8 | `ios-shoot-horizon.png` | iPhone Shoot FAB | Horizon overlay on viewfinder |
| S9 | `ios-critique-radar.png` | Post-capture critique | Radar chart + spatial boxes on preview |
| S10 | `ios-mentor-chat.png` | iPhone Mentor | Portfolio-aware reply |
| S11 | `mcp-cloud-trace.png` | GCP Console Cloud Trace | Spans `mongodb.mcp.find` / `aggregate` |

Store under: `docs/devpost-assets/` (create folder when capturing; **gitignore large binaries** if preferred).

```bash
mkdir -p docs/devpost-assets
# After capture, optional: git add docs/devpost-assets/*.png
```

---

## 3. Diagrams (export from repo)

Source files: `docs/diagrams/*.mmd`

| Diagram | File | Use on Devpost |
|---------|------|----------------|
| System architecture | `architecture.mmd` | Hero or “How I built it” |
| Agent orchestration | `agent-orchestration.mmd` | Multi-agent story |
| Data flow (analyze-photo) | `data-flow.mmd` | MongoDB + Coach pipeline |
| iOS architecture | `ios-architecture.mmd` | Mobile + Field Coach |
| Hobbyist journey | `user-journey-hobbyist.mmd` | Persona slide |
| Working pro journey | `user-journey-pro.mmd` | Print Sales / Triage |

### Export steps

1. Open https://mermaid.live  
2. Paste contents of each `.mmd` file  
3. **Actions → PNG/SVG** → save as `docs/devpost-assets/diagram-<name>.png`  
4. Optional polish: prompt **#14** in [`devpost-visual-prompts.md`](devpost-visual-prompts.md) (keep labels identical)

**Before export — quick label fixes (optional):**

- `architecture.mmd`: change “Gemini 3 Pro” → “Gemini 3.1 Pro”; solid line iOS → FastAPI (not “Phase 1+”)
- Add missing agents on orchestration diagram if any drift (Reflection, Visual Describer)

---

## 4. Cover / hero

| Option | Source |
|--------|--------|
| **A — Brand + UI composite** | Prompt **#1 or #2** in `devpost-visual-prompts.md` + overlay S2 or S9 |
| **B — Icon on canvas** | `frontend/public/iris-icon-512.png` on `#1a1816` background |
| **C — Diagram crop** | Crop `diagram-architecture.png` to 16:9 |

Devpost thumbnail: square crop from hero or use icon (prompt **#3**).

---

## 5. Optional AI-generated assets

Use [`devpost-visual-prompts.md`](devpost-visual-prompts.md) for:

- Hero illustration (not fake UI)
- Glass Box explainer (prompt **#13**) — pair with S2
- MongoDB sponsor slide (prompt **#7**)

**Rule:** Never AI-generate screenshots of Iris UI — judges will compare to live app.

---

## 6. Playground B-roll (optional)

```bash
make playground-demo
```

See [`playground-demo-recording.md`](playground-demo-recording.md) — 30s orchestrator clip for “Built with Google ADK” beat.

---

## 7. Priority order (~half day capture)

1. **Video** — blocks submit  
2. **S2 + S8 + S9** — Glass Box + iPhone differentiators  
3. **Export `architecture.mmd` + `agent-orchestration.mmd`**  
4. **S11 MCP trace** — MongoDB track proof  
5. Remaining gallery shots + cover composite  

---

## 8. Post-capture

- [ ] Video URL in Devpost + article draft  
- [ ] Gallery uploaded (3–5 images minimum)  
- [ ] Cover/thumbnail set  
- [ ] Final read of [`devpost-article-draft.md`](devpost-article-draft.md) against live app  
- [ ] Submit before deadline **Jun 10, 22:00 CET**

---

*Last updated: May 27, 2026 — after A/B/C/E batch + iOS C2/C3/C5 tested.*
