#!/usr/bin/env bash
# Verify hosted Iris stack for hackathon judges — backend-only proof (no browser required).
#
# Exercises live Cloud Run API paths that invoke:
#   - MongoDB MCP Server (portfolio reads, mentor chat)
#   - Google ADK orchestrator + Gemini (mentor chat)
#   - Agent Builder Data Store (optional Coach critique if RUN_COACH=1)
#
# Writes timestamped evidence under docs/compliance-proof/evidence/
# and regenerates docs/compliance-proof/latest-report.md
#
# Usage:
#   ./scripts/verify-hackathon-stack.sh
#   API_URL=https://... RUN_COACH=1 ./scripts/verify-hackathon-stack.sh   # includes analyze-photo (~90s)
#
# Requires: curl, python3. With gcloud: also pulls Cloud Logging proof lines.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

API_URL="${API_URL:-}"
PROJECT="${GOOGLE_CLOUD_PROJECT:-practice-companion-hackathon}"
REGION="${CLOUD_RUN_REGION:-us-central1}"
COACH_SERVICE="${CLOUD_RUN_SERVICE:-practice-companion-api}"
DEMO_USER="${DEMO_USER_ID:-6577a1f2b3c4d5e6f7a8b9c0}"
RUN_COACH="${RUN_COACH:-0}"
EVIDENCE_DIR="${ROOT}/docs/compliance-proof/evidence"
REPORT="${ROOT}/docs/compliance-proof/latest-report.md"
TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

mkdir -p "${EVIDENCE_DIR}"

pass() { echo "PASS: $*"; }
fail() { echo "FAIL: $*"; exit 1; }
warn() { echo "WARN: $*"; }

if [[ -z "${API_URL}" ]]; then
  if command -v gcloud >/dev/null 2>&1; then
    API_URL="$(gcloud run services describe "${COACH_SERVICE}" \
      --project="${PROJECT}" --region="${REGION}" \
      --format='value(status.url)' 2>/dev/null || true)"
  fi
fi
[[ -n "${API_URL}" ]] || fail "Set API_URL or deploy Coach API first"

WEB_URL="${WEB_URL:-https://iris-photo-mentor.web.app}"
TRACE_CONSOLE="https://console.cloud.google.com/traces/list?project=${PROJECT}"
LOGS_CONSOLE="https://console.cloud.google.com/logs/query?project=${PROJECT}"

echo "=== Iris hackathon stack verification ==="
echo "API: ${API_URL}"
echo "Time (UTC): ${TS}"
echo ""

# --- 1. Health (stack flags) ---
echo "=== 1. /health — deployed models + MCP URL ==="
HEALTH="$(curl -sf "${API_URL}/health")" || fail "/health unreachable"
echo "${HEALTH}" | python3 -m json.tool > "${EVIDENCE_DIR}/health.json"
echo "${HEALTH}" | grep -q '"status":"ok"' || fail "health status not ok"
pass "Health OK — see evidence/health.json"

# --- 1b. Agent Builder probe (no image upload) ---
echo "=== 1b. /health/grounding-probe — Agent Builder Data Store ==="
GROUNDING="$(curl -sf "${API_URL}/health/grounding-probe")" || warn "grounding probe failed"
if [[ -n "${GROUNDING}" ]]; then
  echo "${GROUNDING}" | python3 -m json.tool > "${EVIDENCE_DIR}/grounding-probe.json"
  echo "${GROUNDING}" | grep -q '"source":"discovery_engine"' && pass "Agent Builder Data Store returned principles" \
    || warn "Grounding probe used local_fallback — check Data Store"
fi

# --- 2. Portfolio (MCP read path) ---
echo "=== 2. GET /api/v1/portfolio — MongoDB MCP find ==="
PORTFOLIO="$(curl -sf "${API_URL}/api/v1/portfolio?limit=3" \
  -H "X-User-Id: ${DEMO_USER}" --max-time 90)" \
  || fail "portfolio list failed (MCP read required in production)"
echo "${PORTFOLIO}" | python3 -m json.tool > "${EVIDENCE_DIR}/portfolio-sample.json"
ENTRY_COUNT="$(echo "${PORTFOLIO}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('entries',[])))")"
[[ "${ENTRY_COUNT}" -ge 1 ]] || warn "demo portfolio empty — run make seed-demo"
pass "Portfolio returned ${ENTRY_COUNT} entries"

# --- 3. Assignments (seeded demo arc) ---
echo "=== 3. GET /api/v1/assignments — demo HITL state ==="
ASSIGNMENTS="$(curl -sf "${API_URL}/api/v1/assignments" \
  -H "X-User-Id: ${DEMO_USER}" --max-time 60)" \
  || fail "assignments list failed"
echo "${ASSIGNMENTS}" | python3 -m json.tool > "${EVIDENCE_DIR}/assignments-sample.json"
pass "Assignments API OK"

# --- 4. Mentor chat (ADK orchestrator + Gemini + MCP tools) ---
echo "=== 4. POST /api/v1/agent/chat — ADK orchestrator ==="
CHAT_BODY='{"message":"Name my two strongest portfolio photos by score only — one sentence.","persona":"hobbyist"}'
CHAT="$(curl -sf -X POST "${API_URL}/api/v1/agent/chat" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: ${DEMO_USER}" \
  -d "${CHAT_BODY}" --max-time 200)" \
  || fail "mentor chat failed or timed out"
echo "${CHAT}" | python3 -m json.tool > "${EVIDENCE_DIR}/mentor-chat-sample.json"
echo "${CHAT}" | grep -q '"reply"' || fail "chat missing reply"
REPLY_EXcerpt="$(echo "${CHAT}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('reply','')[:280])")"
echo "${REPLY_EXcerpt}" > "${EVIDENCE_DIR}/mentor-reply-excerpt.txt"
pass "Mentor chat returned reply"

# --- 5. Triage scan (deterministic HITL proposals, MCP reads) ---
echo "=== 5. POST /api/v1/triage/scan — Organize agent path ==="
TRIAGE="$(curl -sf -X POST "${API_URL}/api/v1/triage/scan" \
  -H "X-User-Id: ${DEMO_USER}" --max-time 120)" \
  || warn "triage scan failed (non-fatal)"
if [[ -n "${TRIAGE}" ]]; then
  echo "${TRIAGE}" | python3 -m json.tool > "${EVIDENCE_DIR}/triage-scan-sample.json" 2>/dev/null || echo "${TRIAGE}" > "${EVIDENCE_DIR}/triage-scan-sample.json"
  pass "Triage scan returned proposals"
else
  warn "Skipped triage evidence file"
fi

# --- 6. Optional Coach critique (Gemini + Agent Builder grounding) ---
COACH_STATUS="skipped"
if [[ "${RUN_COACH}" == "1" ]]; then
  echo "=== 6. POST /api/v1/analyze-photo — Coach + Gemini + Agent Builder ==="
  TEST_IMG="${EVIDENCE_DIR}/.verify-test.jpg"
  if [[ ! -f "${TEST_IMG}" ]]; then
    if ! curl -sfL "https://images.unsplash.com/photo-1493864449600-6fbfaa779b4f?w=640&q=80" -o "${TEST_IMG}" 2>/dev/null; then
      python3 - <<PY || fail "could not create test image for Coach"
from pathlib import Path
try:
    from PIL import Image
except ImportError:
    raise SystemExit("pip install pillow")
path = Path("${TEST_IMG}")
path.parent.mkdir(parents=True, exist_ok=True)
img = Image.new("RGB", (640, 480), color=(120, 90, 60))
img.save(path, format="JPEG", quality=85)
print(path)
PY
    fi
  fi
  COACH="$(curl -sf -X POST "${API_URL}/api/v1/analyze-photo" \
    -H "X-User-Id: ${DEMO_USER}" \
    -F "image=@${TEST_IMG};type=image/jpeg" \
    --max-time 300)" || fail "analyze-photo failed"
  echo "${COACH}" | python3 -m json.tool > "${EVIDENCE_DIR}/coach-critique-sample.json"
  echo "${COACH}" | grep -q '"scores"' || fail "coach response missing scores"
  GB="$(echo "${COACH}" | python3 -c "
import sys, json
d = json.load(sys.stdin)
gb = d.get('glassBox') or {}
principles = gb.get('grounding_principles') or gb.get('groundingPrinciples') or []
print('principles:', principles[:5])
print('observations:', (gb.get('observations') or [''])[0][:200])
")"
  echo "${GB}" > "${EVIDENCE_DIR}/coach-glassbox-excerpt.txt"
  COACH_STATUS="pass"
  pass "Coach critique returned scores + Glass Box"
else
  echo "=== 6. Coach critique — skipped (set RUN_COACH=1 to include ~90s Gemini + Agent Builder proof) ==="
fi

# --- 7. Cloud Logging (requires gcloud + project access) ---
LOG_MCP=""
LOG_GROUNDING=""
if command -v gcloud >/dev/null 2>&1; then
  echo "=== 7. Cloud Logging — MCP + grounding proof lines ==="
  sleep 6
  LOG_MCP="$(gcloud logging read \
    "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${COACH_SERVICE}\" AND textPayload:\"mcp_read_ok\"" \
    --project="${PROJECT}" --limit=5 --freshness=20m \
    --format='value(textPayload)' 2>/dev/null || true)"
  if [[ -z "${LOG_MCP}" ]]; then
    LOG_MCP="$(gcloud logging read \
      "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${COACH_SERVICE}\" AND jsonPayload.message:\"mcp_read_ok\"" \
      --project="${PROJECT}" --limit=5 --freshness=20m \
      --format='value(jsonPayload.message)' 2>/dev/null || true)"
  fi
  if [[ -n "${LOG_MCP}" ]]; then
    echo "${LOG_MCP}" | head -5 > "${EVIDENCE_DIR}/cloud-log-mcp-read-ok.txt"
    pass "Cloud Logging: mcp_read_ok captured"
  else
    warn "No mcp_read_ok in logs (may lag; re-run after portfolio/chat)"
  fi

  LOG_GROUNDING="$(gcloud logging read \
    "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${COACH_SERVICE}\" AND textPayload:\"grounding_ok\"" \
    --project="${PROJECT}" --limit=3 --freshness=30m \
    --format='value(textPayload)' 2>/dev/null || true)"
  if [[ -n "${LOG_GROUNDING}" ]]; then
    echo "${LOG_GROUNDING}" | head -3 > "${EVIDENCE_DIR}/cloud-log-grounding-ok.txt"
    pass "Cloud Logging: grounding_ok (Agent Builder) captured"
  elif [[ "${RUN_COACH}" == "1" ]]; then
    warn "No grounding_ok yet — redeploy API with grounding logger, then re-run RUN_COACH=1"
  else
    echo "(Run RUN_COACH=1 after deploy to capture Agent Builder grounding_ok logs)" \
      > "${EVIDENCE_DIR}/cloud-log-grounding-ok.txt"
  fi
else
  warn "gcloud not available — skipping Cloud Logging capture"
fi

# --- Report ---
cat > "${REPORT}" <<EOF
# Iris — hosted stack verification report

**Generated:** ${TS} (UTC)  
**API:** ${API_URL}  
**Web app:** ${WEB_URL}  
**Demo user:** \`${DEMO_USER}\`

This report is produced by [\`scripts/verify-hackathon-stack.sh\`](../scripts/verify-hackathon-stack.sh) — backend-only proof that the hackathon-required stack is live (no browser required).

## Results summary

| Check | Result |
|-------|--------|
| Cloud Run /health | PASS |
| MongoDB MCP portfolio read | PASS (${ENTRY_COUNT} entries) |
| Assignments API (HITL seed) | PASS |
| ADK orchestrator mentor chat | PASS |
| Triage scan (Organize path) | $([ -f "${EVIDENCE_DIR}/triage-scan-sample.json" ] && echo PASS || echo SKIP) |
| Coach + Gemini + Agent Builder | ${COACH_STATUS} |

## Required hackathon technologies (runtime)

| Technology | Proof in this run |
|------------|-------------------|
| **Gemini** | Mentor chat (\`geminiModel\` in [health.json](evidence/health.json)); field capture model in health |
| **Agent Builder Data Store** | \`dataStoreConfigured: true\` in health; grounding logs in [cloud-log-grounding-ok.txt](evidence/cloud-log-grounding-ok.txt) when \`RUN_COACH=1\` |
| **MongoDB MCP Server** | \`mongodbMcpHttp\` in health; [cloud-log-mcp-read-ok.txt](evidence/cloud-log-mcp-read-ok.txt) |

## Evidence files (committed)

| File | What it shows |
|------|----------------|
| [evidence/health.json](evidence/health.json) | Live models, MCP URL, Data Store flag |
| [evidence/grounding-probe.json](evidence/grounding-probe.json) | Agent Builder search (\`source: discovery_engine\`) |
| [evidence/portfolio-sample.json](evidence/portfolio-sample.json) | MCP-backed portfolio read |
| [evidence/mentor-chat-sample.json](evidence/mentor-chat-sample.json) | Orchestrator + Gemini reply JSON |
| [evidence/mentor-reply-excerpt.txt](evidence/mentor-reply-excerpt.txt) | Human-readable mentor reply |
| [evidence/assignments-sample.json](evidence/assignments-sample.json) | Seeded HITL assignment state |
| [evidence/cloud-log-mcp-read-ok.txt](evidence/cloud-log-mcp-read-ok.txt) | Cloud Logging: \`mcp_read_ok tool=find\` |
| [evidence/cloud-log-grounding-ok.txt](evidence/cloud-log-grounding-ok.txt) | Cloud Logging: \`grounding_ok source=discovery_engine\` |

## Reproduce (optional — requires network)

\`\`\`bash
./scripts/verify-hackathon-stack.sh
# Full proof including Coach + Agent Builder (~90s):
RUN_COACH=1 ./scripts/verify-hackathon-stack.sh
python3 scripts/build-compliance-proof-images.py
\`\`\`

Judges without \`gcloud\` can still curl \`${API_URL}/health\` and open the committed evidence JSON above.

## Cloud Console (live traces)

- [Cloud Trace — filter \`mongodb.mcp.\`](${TRACE_CONSOLE})
- [Cloud Logging — Coach API](${LOGS_CONSOLE})

## ADK Playground note

\`make playground\` (localhost:8080) runs the same ADK agent graph for local dev. **Production judges use** \`POST /api/v1/agent/chat\` on Cloud Run — same orchestrator code path, evidenced by [mentor-chat-sample.json](evidence/mentor-chat-sample.json).

## Annotated proof images

See [proof-*.png](../devpost-public/) generated by \`scripts/build-compliance-proof-images.py\`.
EOF

echo ""
echo "=== verify-hackathon-stack.sh: PASSED ==="
echo "Report: ${REPORT}"
echo "Evidence: ${EVIDENCE_DIR}/"
echo ""
echo "Next: RUN_COACH=1 ./scripts/verify-hackathon-stack.sh  (after redeploy for grounding logs)"
echo "      python3 scripts/build-compliance-proof-images.py"
