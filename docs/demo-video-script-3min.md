# Iris — 3-minute Devpost demo script

**Only the first 3 minutes are judged.** Target **2:50** content + **0:10** end card.  
**Web:** https://practice-companion-hackathon.web.app · **Demo mode:** Continue without sign-in → **Hobbyist** (switch to Working pro for Print Sales beat if rehearsed).

---

## Prep (15 min)

- [ ] Demo portfolio seeded (≥6 photos) — shoot 2–3 in Studio if empty
- [ ] iPhone: latest Iris from Xcode, demo mode, hobbyist persona
- [ ] Browser: zoom 100%, dark mode default, hide bookmarks bar
- [ ] Screen record: QuickTime (Mac web) + iOS Control Center (phone)
- [ ] Rehearse once without recording

---

## Script

| Time | Visual | Narration (first person) |
|------|--------|---------------------------|
| **0:00–0:15** | Web Home — scroll At a glance + recent work | “I’m Prasad. **Iris** is an AI photography mentor that **remembers** your portfolio — not a one-shot grader.” |
| **0:15–0:40** | Studio → upload photo → wait → **Glass Box** tab, toggle spatial overlay | “Every upload runs through **Coach** on **Gemini 3.1 Pro** — five-axis scores plus **Glass Box** reasoning you can inspect.” |
| **0:40–0:55** | Practice → proposed assignment → **Accept** → **View details** | “**Planner** proposes practice from weak areas. I accept with human-in-the-loop — Iris never assigns silently.” |
| **0:55–1:10** | My Work → search “sunset” or tag → open photo → **similar photos** row | “Memory lives in **MongoDB Atlas** — natural-language search and vector **similar photos** on the same corpus.” |
| **1:10–1:30** | Mentor → tap action chip → **Organize** → approve one HITL card → scroll **history** | “The **orchestrator** routes to **Triage** — tag and dedupe proposals, always with approval. Nothing deletes itself.” |
| **1:30–1:45** | *(Optional, working pro)* Print Sales → approved listing | “For working pros, **Print Sales** drafts marketplace copy — publication stays behind HITL.” |
| **1:45–2:05** | Cut to **iPhone** — Shoot FAB → horizon line tilts → capture → critique **radar** + spatial boxes | “On **iPhone**, **Field Coach** guides composition in the field — horizon level, live cues, then the same Glass Box critique with a radar chart.” |
| **2:05–2:20** | iPhone Mentor — one question | “Same **MongoDB** memory on mobile — Mentor chat knows my portfolio.” |
| **2:20–2:35** | Web Settings → theme toggle **or** terminal: `verify_mcp_in_production.sh` output | “Production reads go through **MongoDB MCP** — judges can verify traces — and the web app ships light and dark themes.” |
| **2:35–2:50** | Split screen or quick montage: web + phone icons | “**Iris** — nine ADK agents, one memory layer, web studio plus native field capture.” |
| **2:50–3:00** | End card: URL + GitHub | “Try it at **practice-companion-hackathon.web.app** — links in the description.” |

---

## B-roll swaps (if something fails live)

| Failed beat | Substitute |
|-------------|------------|
| Studio slow | Pre-recorded critique screen (S2) as still + voiceover |
| iPhone coach offline | Gallery pick + critique sheet only |
| MCP script | `/health` JSON showing `mcp_status: ok` in browser |

---

## Technical captions (description field, not voiceover)

- Google ADK · 9 `LlmAgent` instances · persona tool filtering  
- Cloud Run FastAPI (demo API) · Agent Engine scaffold in repo  
- MongoDB Atlas: vectors + Atlas Search + MCP read path  
- Firebase Hosting · SwiftUI iOS  

---

## After recording

1. Trim dead air; keep ≤3:00  
2. Upload unlisted YouTube or Vimeo  
3. Add URL to Devpost + [`devpost-article-draft.md`](devpost-article-draft.md)  
4. Pull 3–5 still frames for gallery → [`devpost-media-checklist.md`](devpost-media-checklist.md)

---

*Companion: [`ios-demo-video-script.md`](ios-demo-video-script.md) for iPhone-only 60–90s cut.*
