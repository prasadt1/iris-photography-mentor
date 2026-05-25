# MCP-primary reads — what judges hit vs what the code proves

**Consolidation item 3** is about routing **MongoDB reads** through a single module (`app/memory/mcp_reads.py`) so sub-agents and tools do not call PyMongo ad hoc. It is **not** the same as “every HTTP request on web.app goes through the MongoDB MCP Server.”

## Three runtime paths

| Path | Who uses it | MongoDB reads | MCP Server |
|------|-------------|---------------|------------|
| **A — Hosted demo** | Judges on Firebase → Cloud Run `practice-companion-api` | Coach / planner / memory APIs use **PyMongo directly** (`app/memory/*.py`, coach pipeline) | **Not invoked** |
| **B — ADK playground** | Local `make playground` (:8080) | Orchestrator tools + sub-agents import **`mcp_reads`** | Optional when `mcp-config.json` + `npx` MongoDB MCP available |
| **C — Change-stream listener** | Cloud Run `change-stream-listener` | **PyMongo** watch on `portfolio_entries` | **Not invoked** |

Judges on **https://practice-companion-hackathon.web.app** use path **A**. That is intentional for latency and ops: one Cloud Run service, no stdio MCP child process.

## What `mcp_reads` actually does today

- All sub-agent read tools (`coach`, `planner`, `triage`, `mentor`, etc.) import `memory.mcp_reads` instead of raw `collection.find`.
- When `ORCHESTRATOR_USE_MCP=true` (default), the module **records** MCP-primary attempts and **falls back to PyMongo** for the actual query (see `_try_mcp_find` in `mcp_reads.py`).
- **Writes** always use PyMongo (hot path).

So item 3 in the repo means: **contract + routing layer + tests**, with MCP as the **declared** read surface for the multi-agent stack, and PyMongo as the **production** implementation until a hosted MCP sidecar is deployed.

## Honest Devpost / judge lines

Use wording like:

- “Sub-agent memory reads go through an MCP-primary abstraction; the hosted Coach API uses the same Atlas data via PyMongo for reliability.”
- “Full MongoDB MCP Server tooling is demonstrated in the local ADK playground (`make playground`) with `mcp-config.json`.”

Avoid claiming judges’ browser sessions execute MCP tool calls unless you add a Cloud Run MCP bridge.

## Verification

```bash
./scripts/verify_v5_spec.sh   # items 1–13 including mcp_reads imports + test_mcp_primary.py
```

## If you want MCP on the hosted path later

Options (not required for hackathon):

1. **Sidecar / second service** — MCP server with Atlas credentials; API calls HTTP MCP instead of PyMongo for reads.
2. **Agent Engine / Vertex** — deploy orchestrator where Google hosts tool execution.
3. **Implement real MCP in `_try_mcp_find`** — wire MongoDB MCP `find`/`aggregate` tools instead of immediate fallback.

Until then, item 3 is **satisfied for architecture + local demo**; item **A** remains the judge-facing path.
