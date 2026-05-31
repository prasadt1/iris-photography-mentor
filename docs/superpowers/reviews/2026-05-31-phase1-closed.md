# Phase 1 — Closed

**Date:** 2026-05-31  
**Spec:** `docs/superpowers/specs/2026-05-31-iris-full-polish-design.md` (§Phase 1)

## Closure checklist

| Item | Status |
|------|--------|
| Layered Home (first visit / returning) | Done |
| Full-bleed hero, stats API, pitch band, mentor card | Done |
| Contact sheet + upload CTA | Done |
| Sidebar dashboard strip | Done |
| Footer 3-line, all viewports | Done |
| **3-column At a glance** (avg score, recent trend, assignments done) | Done |
| **Logo in chrome** | `iris-icon.png` (+ 2× `iris-icon-512.png` via srcSet); `iris-mark.svg` kept but not used — blades read as flower at small sizes |
| **Then/Now growth** — only when `portfolioTotal >= 6` and earliest ≠ strongest | Done |
| **Palette pass** — reduced amber on non-CTA cards (practice win, sidebar contextual) | Done |
| `npm run build` | Run before deploy |
| `app/.venv/bin/python -m pytest app/tests/` | Run before deploy |

## Verification commands

```bash
cd frontend && npm run build
cd .. && app/.venv/bin/python -m pytest app/tests/ -q
./scripts/verify-phase1-gate.sh   # broader hackathon gate
```

## Deferred to later phases (not Phase 1)

- Practice Win thumbnail / brief-applied → Phase 2
- Print Sales approved-listings visibility → Phase 3 §3.4

## Next phase gate

Phases 2–3 closed. Consolidated handoff: `docs/superpowers/reviews/2026-05-31-phases-1-3-review-for-claude.md`.
