# Runtime proof — ADK Playground capture (Tier 2)

Optional evidence that the **same orchestrator** wired in production (`app/agent.py`) is visible in the **ADK dev playground** (localhost). This is not the live product URL — label it honestly as dev UI.

## Two-layer proof (use both)

| Layer | What it shows | Artifact |
|-------|----------------|----------|
| **Roster** | All 9 LlmAgents exist in code | `proof-05-agent-graph.png` + `agent-graph.json` (from `scripts/dump-agent-graph.py`) |
| **Runtime** | Orchestrator **delegates** to different sub-agents and tools fire | PNGs in this folder (mentor + triage captures) |

**Do not expect one chat turn to invoke every sub-agent.** One message → one specialist. Use **multiple turns in the same session** (mentor, then triage) plus proof-05 for the full nine-agent story.

The left sidebar in the playground lists **Python packages** (`sub_agents`, `memory`, …), not the agent roster. Select **`orchestrator`** in the app dropdown — not `sub_agents`.

## Prereqs

- `gcp-service-account.json` at repo root
- `.env` with `MONGODB_URI`, `DEMO_USER_ID`, Gemini / Vertex vars
- Clean desktop, **1920×1080** window, no stray tabs
- Responses can take **30–90 seconds** — wait for Events / Traces to populate

## Start

```bash
cd /path/to/iris-photography-mentor
export GOOGLE_APPLICATION_CREDENTIALS="$(pwd)/gcp-service-account.json"
make playground
```

Browser: **http://127.0.0.1:8080** (ADK playground — not Coach API on 8081).

1. App dropdown → **`orchestrator`**
2. **NEW SESSION**

---

## Shot 1 — Roster (use proof-05, not the sidebar)

The playground UI does **not** show a tree of all nine agent names. For the roster, judges use:

- `docs/devpost-public/proof-05-agent-graph.png`
- `docs/compliance-proof/evidence/agent-graph.txt`

Optional playground frame: header showing **`orchestrator`** selected (entrypoint only).

**Save as (optional):** `playground-01-orchestrator-entry.png`

---

## Shot 2 — Mentor delegation (required)

**Prompt (turn 1):**

> Name my two strongest portfolio photos by score only — one sentence.

**Capture:**

| File | What to frame |
|------|----------------|
| `playground-02a-mentor-events.png` | Events timeline: user message → `mentor` (⚡ then ✓); expand Event showing `skipSummarization: true` and function response |
| `playground-02b-mentor-traces.png` | **Traces** tab: `call_llm` → `mentor` → nested `get_recent…` / `atlas_search…` / MongoDB spans |

**Caption:** *ADK dev playground — orchestrator delegates to Mentor; portfolio tools fire (~41s trace). Same graph as Cloud Run `POST /api/v1/agent/chat`.*

---

## Shot 3 — Triage delegation (required — second turn, same session)

**Prompt (turn 2, do not start a new session):**

> Scan my library for duplicate photos

**Capture:**

| File | What to frame |
|------|----------------|
| `playground-03-triage-events.png` | Events timeline showing **both** turns: mentor (earlier) + triage (`#5` / `#6`); proves multiple sub-agents in one orchestrator session |
| `playground-03b-triage-response.png` | (Optional) Function response close-up: duplicate sequences, HITL / persona clarifying question |

**Caption:** *Turn 2: orchestrator routes to Triage — library scan, duplicate detection, human-in-the-loop deletion proposals (persona-aware).*

---

## Shot 4 — Persona gating (optional)

Skip if time is short — `proof-05` documents gating in code.

1. Switch persona to **working_pro** (Settings in product, or env `DEFAULT_PERSONA`) and confirm `print_sales` appears in orchestrator tools.
2. Or capture Triage’s in-response persona question (hobbyist vs working pro) from Shot 3b.

**Save as:** `playground-04-persona-gating.png`

---

## Honesty guardrails

| Say | Do not say |
|-----|------------|
| ADK dev playground (localhost) | Production judge URL |
| Same orchestrator entrypoint as Cloud Run | Agent Engine is what judges hit today |
| One turn → one sub-agent; proof-05 lists all nine | “All nine agents ran in this screenshot” |

**Voiceover one-liner:** *"Production runs on Cloud Run; this is the same ADK orchestrator — Mentor for portfolio chat, Triage for library cleanup."*

---

## Committed captures

| File | Content |
|------|---------|
| [playground-02a-mentor-events.png](playground-02a-mentor-events.png) | Mentor delegation — Events + function response |
| [playground-02b-mentor-traces.png](playground-02b-mentor-traces.png) | Mentor — Traces waterfall (~41s, MongoDB tools) |
| [playground-03-triage-events.png](playground-03-triage-events.png) | **Gallery pick** — mentor + triage in one session |
| [playground-03b-triage-response.png](playground-03b-triage-response.png) | Triage function response + persona HITL question |

Public URL base: `https://raw.githubusercontent.com/prasadt1/iris-photography-mentor/main/docs/runtime-proof/`

---

## Proof stack (complete)

| Layer | Artifact |
|-------|----------|
| Code (9 agents) | `agent-graph.json`, `proof-05-agent-graph.png` |
| Runtime API | Cloud Trace + `mcp_read_ok` / `grounding_ok`, `verify-hackathon-stack.sh` |
| Orchestration UI | `playground-02a/b` (mentor) + `playground-03` (triage) |

**Devpost gallery:** one slot for proof-05 (roster) + at most **one** playground image (recommend `playground-03-triage-events.png` — shows two agents in one session). Put the rest in this folder or article appendix.
