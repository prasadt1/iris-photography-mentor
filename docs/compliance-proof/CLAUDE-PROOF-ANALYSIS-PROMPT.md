# Claude prompt — analyze Iris agentic proof package

Copy everything below the line into Claude (claude.ai or Claude Code). Attach images or point Claude at the GitHub repo.

---

## PROMPT (copy from here)

You are a **hackathon technical judge** reviewing whether **Iris** (AI photography mentor) is a **real multi-agent production implementation** or marketing/mockup.

**Repo:** https://github.com/prasadt1/iris-photography-mentor  
**Proof index:** https://github.com/prasadt1/iris-photography-mentor/blob/main/docs/compliance-proof/PROOF-PACKAGE.md

**Live endpoints (verify if you can fetch):**
- Web: https://iris-photo-mentor.web.app
- API health: https://practice-companion-api-l6kusl5xcq-uc.a.run.app/health
- Grounding probe: https://practice-companion-api-l6kusl5xcq-uc.a.run.app/health/grounding-probe

**GCP project:** `practice-companion-hackathon`

---

### What to analyze (read in this order)

#### A. Master index
- `docs/compliance-proof/PROOF-PACKAGE.md`

#### B. Scripted proof panels (annotated gallery images)
Base: `https://raw.githubusercontent.com/prasadt1/iris-photography-mentor/main/docs/devpost-public/`
- `proof-01-mcp-read.png` — MongoDB MCP
- `proof-02-orchestrator.png` — ADK + Gemini chat
- `proof-03-agent-builder.png` — Discovery Engine grounding
- `proof-04-stack-health.png` — `/health` flags
- `proof-05-agent-graph.png` — 9 ADK agents + persona matrix

#### C. Google Cloud Console screenshots (runtime, not mockup)
Base: `https://raw.githubusercontent.com/prasadt1/iris-photography-mentor/main/docs/compliance-proof/cloud-console/`

| File | Expected content |
|------|------------------|
| `cloud-trace-explorer-mongodb-mcp-find-heatmap.png` | Trace Explorer heatmap; `mongodb.mcp.find` spans dominate |
| `cloud-trace-explorer-spans-api-mcp.png` | Span list: `/api/v1/portfolio`, `/mcp`, `mongodb.mcp.find` |
| `cloud-logging-mcp-read-ok-search.png` | Logs search `mcp_read_ok`; `tool=find collection=portfolio_entries` |
| `cloud-logging-mcp-portfolio-aesthetic-profile.png` | Logs showing `mongodb-mcp-…run.app/mcp` HTTP + portfolio reads |
| `cloud-trace-detail-mongodb-mcp-find-attributes.png` | Single trace: OpenTelemetry `mcp.tool_name=find`, `mongodb.collection=portfolio_entries` |

#### D. ADK playground captures (dev UI — same orchestrator code)
Base: `https://raw.githubusercontent.com/prasadt1/iris-photography-mentor/main/docs/runtime-proof/`
- `playground-02a-mentor-events.png` — orchestrator → mentor
- `playground-02b-mentor-traces.png` — mentor trace waterfall
- `playground-03-triage-events.png` — mentor + triage in one session
- `playground-03b-triage-response.png` — triage HITL response
- `playground-04a-coach-delegation-image.png` — orchestrator → **coach** with image upload
- `playground-04b-coach-glassbox-response.png` — coach Glass Box JSON
- `playground-04c-coach-function-response-detail.png` — full FUNCTION RESPONSE (scores, bounding_boxes)

Label playground honestly: **localhost ADK dev UI**, not the public judge URL. Same entrypoint as Cloud Run (`app/agent.py`). **One session proves three sub-agents:** mentor → triage → coach.

#### E. Machine-readable evidence (JSON / text)
Base: `https://raw.githubusercontent.com/prasadt1/iris-photography-mentor/blob/main/docs/compliance-proof/evidence/`
- `agent-graph.json`, `agent-graph.txt` — 9 agents from live ADK import
- `health.json`, `grounding-probe.json`
- `mentor-chat-sample.json`, `portfolio-sample.json`, `triage-scan-sample.json`
- `coach-critique-sample.json`
- `cloud-log-mcp-read-ok.txt`, `cloud-log-grounding-ok.txt`

#### F. Source code (spot-check claims)
- `app/agent.py` — `build_persona_filtered_tool_list()`, `AgentTool` delegation
- `app/tools/grounding.py` — Discovery Engine + `grounding_ok` logging
- `app/memory/mcp_http_client.py` — MCP HTTP transport
- `scripts/dump-agent-graph.py`, `scripts/verify-hackathon-stack.sh`

#### G. Architecture diagrams
- `docs/devpost-public/diagram-architecture.png`
- `docs/devpost-public/diagram-agent-orchestration.png`

---

### Your tasks

#### 1. Claim vs evidence matrix
For each requirement, fill:

| Requirement | Claim (from README/Devpost) | Evidence files / URLs | Verdict |
|-------------|----------------------------|------------------------|---------|
| Google ADK — 9 agents | | | PROVEN / PARTIAL / MISSING |
| Gemini (3.1 Pro + 2.5 Flash) | | | |
| Agent Builder / Discovery Engine | | | |
| MongoDB MCP Server (partner) | | | |
| Human-in-the-loop | | | |
| Production (not localhost-only) | | | |

#### 2. Nine-agent audit
- List all 9 agents from `agent-graph.json`
- Persona gating: hobbyist vs working_pro vs vision_impairment
- Which agents have **runtime** proof (API, logs, trace, playground) vs code-only?

#### 3. MongoDB MCP audit
Cross-check:
- Cloud Trace span names (`mongodb.mcp.find`)
- Cloud Logging (`mcp_read_ok`, `mongodb-mcp-…run.app/mcp`)
- Trace span attributes (`mcp.tool_name`, `mongodb.collection`)
- `proof-01` and `portfolio-sample.json`

Do these align? Any gap a skeptical judge could exploit?

#### 4. Agent Builder audit
- `grounding-probe.json` — is `source: discovery_engine`?
- `proof-03` and `coach-critique-sample.json` — grounded principle IDs?
- Any sign of `local_fallback` only?

#### 5. Mockup vs production
Using console screenshots + live `/health`:
- Is OpenTelemetry exporting real spans?
- Is MCP a separate Cloud Run service (`mongodb-mcp`)?
- What is still **aspirational** vs **proven**?

#### 6. Gallery recommendation
Pick **8 Devpost images** (max) that best prove agentic implementation. Use filenames from `PROOF-PACKAGE.md`. One sentence caption each.

#### 7. Gaps and fixes (priority order)
What is missing or weak? What one action would strengthen the package most before submission?

#### 8. Judge-ready paragraph (150 words max)
Accurate "Built with" blurb: Gemini, ADK, Agent Builder, MongoDB MCP, Cloud Run. No overclaiming. Mention playground = dev UI.

---

### Honesty rules for your analysis
- Playground = localhost dev UI; production judges use Cloud Run API + web app.
- MCP is primary on **reads**; writes may use PyMongo after HITL approval.
- One chat turn routes to **one** sub-agent; proof-05 lists all nine; playground shows mentor + triage across two turns.
- Do not treat architecture diagrams alone as runtime proof.

---

### Optional: if I attach images
I may attach PNGs from `docs/compliance-proof/cloud-console/` and `docs/runtime-proof/`. Analyze them visually and cross-reference against the matrix above.

## END PROMPT
