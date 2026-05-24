# Architecture decisions (ADR-lite)

Canonical requirements remain in [`spec.md`](spec.md). These record **why** for implementers and judges.

---

## ADR-001: MongoDB Atlas region is `europe-west3` only

**Status:** Accepted  
**Context:** For this Atlas org/project, the only available GCP region is Belgium (`europe-west3`).  
**Decision:** Run Atlas Flex cluster in `europe-west3`. Run Vertex AI Agent Engine, embeddings, and GCS in `us-central1`.  
**Consequences:** Cross-region latency (~100–150ms) on DB round-trips; acceptable for Studio Mode. Document in infra; avoid chatty N+1 queries from agents. No second Atlas region for hackathon.

---

## ADR-002: Store images in GCS, metadata in MongoDB

**Status:** Accepted  
**Context:** `portfolio_entries` needs `image_url` / `thumbnail_url` for UI, Reflection multi-image, and Gemini multimodal input. Storing binary in MongoDB bloats docs and breaks vector/search ergonomics.  
**Decision:**

- **Google Cloud Storage** bucket `gs://practice-companion-portfolio` (or project default bucket + prefix `portfolio/`).
- Upload: client or backend writes object → store `gs://` URI (or short-lived signed HTTPS URL for Gemini) in MongoDB.
- **Thumbnails:** generated on upload (resize) → `thumbnails/{user_id}/{entry_id}.jpg`.
- **MongoDB holds:** URLs, EXIF, scores, Glass Box, spatial metadata, **embedding vector** — not image bytes.

**Demo / seed:** `scripts/seed-demo-data.py` uploads licensed images once to GCS, then inserts MongoDB docs with stable URLs.

**XMP:** Still client-side export (no change); user keeps originals locally / in Lightroom.

---

## ADR-003: Orchestrator reads via MCP; sub-agents write via PyMongo

**Status:** Accepted  
**Context:** Hackathon partner story needs MongoDB MCP on the orchestrator. Sub-agents need reliable structured writes during Coach/Planner/Reflection.  
**Decision:**

| Path | Mechanism |
|------|-----------|
| Orchestrator queries (portfolio, assignments, profile, vector/search) | **MongoDB MCP Server** (MCPToolset) |
| Coach / Planner / Reflection inserts & updates | **PyMongo** (same `MONGODB_URI`) |

**Judge narrative:** “Orchestrator’s memory interface is MongoDB MCP; operational writes are co-located in Atlas via the same schema.” Optional later: route writes through MCP tools.

**Fallback:** If MCP deploy blocks Phase 2, orchestrator can use PyMongo temporarily (document in README; restore MCP before submission).

---

## ADR-004: `shoot_id` is a logical grouping, not a collection

**Status:** Accepted  
**Context:** Assignments reference `baseline_shoot_ids` / `completion_shoot_ids`; portfolio entries carry `shoot_id`.  
**Decision:** No `shoots` collection for MVP. `shoot_id` is an `ObjectId` shared by entries from one upload session. UI groups by `shoot_id`; queries use `$in` on `portfolio_entries`.

---

## ADR-005: Atlas tier is Flex (confirmed)

**Status:** Accepted  
**Context:** Vector Search, Atlas Search, and change streams require Flex+ (not M0).  
**Decision:** Cluster `practice-photography-companion-mvp-cluster` on **Flex** tier, GCP `europe-west3`.

---

## ADR-006: Environment variables and MCP config

**Status:** Accepted  

| App runtime (`.env`) | MCP (`mcp-config.json`) |
|----------------------|-------------------------|
| `MONGODB_URI` | `MDB_MCP_CONNECTION_STRING` (same URI, include `/practice_companion`) |
| `MONGODB_ATLAS_CLIENT_ID` | `MDB_MCP_API_CLIENT_ID` |
| `MONGODB_ATLAS_CLIENT_SECRET` | `MDB_MCP_API_CLIENT_SECRET` |

See [`mongodb-setup.md`](mongodb-setup.md).

---

## ADR-007: HITL assignment approval — MVP implementation

**Status:** Accepted (updated May 24, 2026)
**Context:** Assignment workflow needs human-in-the-loop control. Planner generates assignments; user decides whether to practice them. Mode toggle (hobbyist vs working-pro) also demonstrates human routing control for judges.
**Decision:**

MVP includes HITL via assignment status flow:
- Planner creates assignment with `status: proposed`
- User reviews assignment in Practice tab
- User clicks "Accept" → status changes to `active`
- User clicks "Decline" → status changes to `abandoned`
- Only `active` assignments trigger Reflection sub-agent on completion

**UI Implementation** (Phase 3):
- Practice tab displays proposed assignments with Accept/Decline buttons
- Active assignments show progress and baseline comparisons
- Completed assignments show ISAR delta

**Judge narrative:** Mode toggle + assignment approval = two forms of HITL routing, demonstrating human oversight of AI recommendations.

---

## ADR-008: Use google-agents-cli instead of agent-starter-pack

**Status:** Accepted
**Context:** Spec §1.1 references `agent-starter-pack` with `adk_live` template. During Phase 1 execution (May 24, 2026), `agent-starter-pack` showed interactive prompts incompatible with non-interactive mode, and suggested using the newer `google-agents-cli` as "the next evolution."
**Decision:** Use `google-agents-cli create app --adk --region us-central1 --cicd-runner github_actions` to generate ADK scaffold. This creates the same ADK-based agent structure but via the newer CLI tool.
**Consequences:**
- Scaffold created successfully with ADK + Agent Runtime deployment target
- Template is basic ADK (not specifically `adk_live` multimodal RAG), but provides identical foundation for customization
- All Phase 2+ implementation proceeds as planned with ADK agents, tools, and sub-agents
- Document in implementation-plan.md as verified approach
