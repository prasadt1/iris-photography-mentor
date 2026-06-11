# Iris Devpost collages (Jun 7 captures)

Section montages — 1:1 screenshot fidelity, iris wordmark, centered captions, tech tags.

**UI collages** tell the product story. **Diagram slices** (`diagram-01` … `diagram-04`) in gallery cover MongoDB plumbing — see [`devpost-media-matrix.md`](../devpost-media-matrix.md).

Regenerate: `python3 scripts/build-devpost-collages.py`

## Multi-panel collages (`collage-*.png`)

Full flows — numbered steps, all screens in a section.

| File | Devpost gallery title | Caption | Tech tags |
|------|----------------------|---------|-----------|
| `collage-01-home-memory.png` | Home — your library remembered | Dashboard with At a glance scores, best-in-library hero, and a growing contact sheet — not a one-shot critique tool. | MongoDB portfolio memory, GCS thumbnails, on-read skill profiles |
| `collage-02-glass-box-studio.png` | Glass Box — photo + five-axis scores | Gemini multimodal critique with spatial overlay, Glass Box reasoning tab, and actionable How to fix guidance. | Coach agent, Gemini 2.5 Flash, Glass Box schema write |
| `collage-03-practice.png` | Practice — HITL assignments | AI-proposed practice brief with human accept/decline — assignments target your weakest skills from portfolio memory. | Planner agent, Reflection agent, HITL accept/decline |
| `collage-04-mentor-chat.png` | Mentor — ADK orchestrator chat | Multi-agent Mentor chat: orchestrator delegates to sub-agents while grounding answers in your portfolio history. | ADK Orchestrator, MongoDB MCP, 9 LlmAgents |
| `collage-05-organize-hitl.png` | Organize — human approval required | Backlog triage with tag harmonization and duplicate detection — every bulk change waits in Pending Approvals. | Triage agent, HITL approvals, tag harmonization |
| `collage-06-my-work-library.png` | My Work — NL search + similar photos | Natural-language library search (Gemini query expansion → Atlas Search) and similar-photo row on expand. | Atlas Search, Vector Search, MongoDB MCP |
| `collage-07-working-pro.png` | Working pro — Print Sales HITL | Listing drafts for Etsy-style print sales plus Settings for persona, theme, and field-coach preferences. | Print Sales Strategist, persona modes, HITL listings |

## Hero singles (`hero-*.png`)

One screenshot per section with cream header + tech tags (branded card).

## Standalone UI (`standalone-*.png`) — **use for Devpost gallery**

Byte-identical copies of source captures — maximum fidelity, no header chrome.

| File | Source | Caption | Panel tech tags |
|------|--------|---------|-----------------|
| `standalone-01-home-memory.png` | `Iris-Home-1.png` | Dashboard — hero frame, score trends, and contact-sheet library. | GET /portfolio, hero selection |
| `standalone-02-glass-box-studio.png` | `Iris-photo-analysis-result-1.png` | Overview — five dimensions scored on your photo. | 5-axis scores, spatial overlay |
| `standalone-03-practice.png` | `Iris-practice.png` | Proposed and active assignments with reflection loop when you complete a shoot. | skill-gap targeting, MongoDB assignments |
| `standalone-04-mentor-chat.png` | `Iris-Mentor-Chat-Result.png` | Portfolio-aware reply — bullet synthesis with voiceover support. | portfolio grounding, concise bullets |
| `standalone-05-organize-hitl.png` | `Iris-Organize-2.png` | Tag proposals — photo thumbnails with suggested labels (golden hour, triage reviewed). | pending approvals, photo thumbnails |
| `standalone-06-my-work-library.png` | `Iris-My-Work-3-Search.png` | NL search — short query expanded and ranked by Atlas Search. | Gemini expansion, glass_box_search |
| `standalone-07-working-pro.png` | `Iris-Print-Sales.png` | Print Sales Strategist — draft listings await explicit approval. | listing drafts, HITL gate |

| File | Hero screenshot | Caption | Panel tech tags |
|------|-----------------|---------|-----------------|
| `hero-01-home-memory.png` | `Iris-Home-1.png` | Dashboard — hero frame, score trends, and contact-sheet library. | GET /portfolio, hero selection |
| `hero-02-glass-box-studio.png` | `Iris-photo-analysis-result-1.png` | Overview — five dimensions scored on your photo. | 5-axis scores, spatial overlay |
| `hero-03-practice.png` | `Iris-practice.png` | Proposed and active assignments with reflection loop when you complete a shoot. | skill-gap targeting, MongoDB assignments |
| `hero-04-mentor-chat.png` | `Iris-Mentor-Chat-Result.png` | Portfolio-aware reply — bullet synthesis with voiceover support. | portfolio grounding, concise bullets |
| `hero-05-organize-hitl.png` | `Iris-Organize-2.png` | Tag proposals — photo thumbnails with suggested labels (golden hour, triage reviewed). | pending approvals, photo thumbnails |
| `hero-06-my-work-library.png` | `Iris-My-Work-3-Search.png` | NL search — short query expanded and ranked by Atlas Search. | Gemini expansion, glass_box_search |
| `hero-07-working-pro.png` | `Iris-Print-Sales.png` | Print Sales Strategist — draft listings await explicit approval. | listing drafts, HITL gate |

## Recommended Devpost gallery order (hero singles)

1. `standalone-02-glass-box-studio.png` — cover / thumbnail
2. `standalone-01-home-memory.png`
3. `standalone-05-organize-hitl.png`
4. `standalone-06-my-work-library.png`
5. `standalone-04-mentor-chat.png`
6. `standalone-03-practice.png`
7. `standalone-07-working-pro.png`

Use **`collage-*`** for full multi-step story; **`standalone-*`** for gallery (max quality); **`hero-*`** if you want branded cream frame.

Then add **diagram** gallery slots: architecture, agents, diagram-04-library-search.
