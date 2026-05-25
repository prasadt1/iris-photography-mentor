# Design review — implementation status

**Last updated:** 2026-05-25 (after Tier A–C + Tier D/E/F batch)

Reference: [`design-reviews.md`](design-reviews.md), [`design-review-brief.md`](design-review-brief.md)

## Shipped

| Pass / issue | Status |
|--------------|--------|
| Pass 2 — Home, onboarding, bottom nav, sidebar | Done (Tier B) |
| Pass 1 — Tab copy, jargon (most), focus-visible, Studio hero steps | Done (Tier A) |
| Pass 5 — Mentor staged loading, skeletons, friendly errors | Done (Tier C) |
| Pass 6 — Glass Box sans, default tab, Why?, HITL callout | Done (Tier C) |
| Pass 3 subset — Newsreader, warm bg | Done (Tier C) |
| **Tier D** — Field 390px, rule-of-thirds overlay, brief clamp | Done |
| **Tier D** — Label Photos in sidebar + Home (all modes) | Done |
| **Tier D** — ISAR → plain skill-application copy | Done |
| **Tier D/E** — Amber accent tokens | Done |
| **Tier D/E** — Evidence human labels | Done |
| **Tier D/E** — Memory matte frames + score badge | Done |
| **Tier D/E** — Print hobbyist preview + Switch to Working pro | Done |
| **Tier F** — Triage/Print scan staged progress | Done |
| **Tier F** — Offline banner, Settings “What I remember” | Done |
| **Tier F** — Skip link, ShootNow focus trap, PWA manifest | Done |
| **Tier F** — `demo-script.md` updated for new IA | Done |
| Print price `<label>` + alt text | Done |
| Practice Active/Completed status (icon + text) | Done |

## Still future (honest)

| Item | Why deferred |
|------|----------------|
| Memory trend sparklines | Backend aggregation + charts |
| Dynamic Mentor starters | New API endpoint |
| Vision impairment web UI | Phase 3–4 spec |
| Full PWA (service worker, offline upload queue) | >2 days |
| Firebase Auth / multi-user | Hackathon uses demo user |
| Live Etsy API | Out of scope per brief |
| Geist body font | Inter retained; amber applied |
| Full Memory grid redesign (Pass 3 mockups) | Partial (matte + badge only) |
| Bidirectional score ↔ Glass Box highlight | Large interaction pass |

## Branch

`design/tier-a` — commit Tier D/E/F batch before deploy.
