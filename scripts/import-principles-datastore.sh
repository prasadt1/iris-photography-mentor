#!/usr/bin/env bash
# Import the photography principles into the Agent Builder (Discovery Engine) Data Store.
#
# This is the step that turns the Coach's grounding from `local_fallback` into a real
# `source: discovery_engine` result. The Data Store is an UNSTRUCTURED (CONTENT_REQUIRED)
# store, so each principle is staged in GCS as text/plain and imported with explicit
# document IDs (composition, lighting, ...) via a JSONL metadata file. Clean IDs matter:
# app/tools/grounding.py maps them to titles + excerpts (composition.md -> "Composition").
#
# Idempotent: re-running performs a FULL reconciliation (replaces existing docs).
#
# Usage:
#   ./scripts/import-principles-datastore.sh
#   DATA_STORE_ID=... GCS_BUCKET=... ./scripts/import-principles-datastore.sh
#
# Requires: gcloud (authenticated), gsutil, curl, python3.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

PROJECT="${GOOGLE_CLOUD_PROJECT:-practice-companion-hackathon}"
DATA_STORE_ID="${DATA_STORE_ID:-photography-principles_1779626390010}"
LOCATION="${DATA_STORE_LOCATION:-global}"
GCS_BUCKET="${GCS_BUCKET:-practice-companion-principles}"
PRINCIPLES_DIR="${ROOT}/principles"

# (doc_id, "Title") — must match TITLE_FROM_ID in app/tools/grounding.py
DOCS=(
  "composition:Composition"
  "creativity:Creativity"
  "lighting:Lighting"
  "subject_impact:Subject impact"
  "technique:Technique"
)

DE="https://discoveryengine.googleapis.com/v1"
BASE="${DE}/projects/${PROJECT}/locations/${LOCATION}/collections/default_collection/dataStores/${DATA_STORE_ID}"
BRANCH="${BASE}/branches/default_branch"

echo "=== Import principles -> Agent Builder Data Store ==="
echo "Project:    ${PROJECT}"
echo "Data Store: ${DATA_STORE_ID} (${LOCATION})"
echo "Bucket:     gs://${GCS_BUCKET}"
echo ""

TOKEN="$(gcloud auth print-access-token)"
AUTH=(-H "Authorization: Bearer ${TOKEN}" -H "X-Goog-User-Project: ${PROJECT}")

# --- 1. Stage each principle as text/plain (.md is not a recognized content type) ---
echo "--- Staging principles as text/plain in GCS ---"
for entry in "${DOCS[@]}"; do
  id="${entry%%:*}"
  src="${PRINCIPLES_DIR}/${id}.md"
  [[ -f "${src}" ]] || { echo "MISSING: ${src}" >&2; exit 1; }
  gsutil -h "Content-Type:text/plain" cp "${src}" "gs://${GCS_BUCKET}/txt/${id}.txt" >/dev/null 2>&1
  echo "  staged ${id}.txt"
done

# --- 2. Build JSONL metadata with explicit, clean document IDs ---
echo "--- Building document metadata (clean IDs + titles) ---"
META="$(mktemp -t principles-metadata.XXXXXX.jsonl)"
: > "${META}"
for entry in "${DOCS[@]}"; do
  id="${entry%%:*}"
  title="${entry#*:}"
  python3 - "$id" "$title" "$GCS_BUCKET" >> "${META}" <<'PY'
import json, sys
doc_id, title, bucket = sys.argv[1], sys.argv[2], sys.argv[3]
print(json.dumps({
    "id": doc_id,
    "structData": {"title": title},
    "content": {"mimeType": "text/plain", "uri": f"gs://{bucket}/txt/{doc_id}.txt"},
}))
PY
done
gsutil -h "Content-Type:application/jsonl" cp "${META}" \
  "gs://${GCS_BUCKET}/metadata/principles-metadata.jsonl" >/dev/null 2>&1
rm -f "${META}"
echo "  uploaded principles-metadata.jsonl"

# --- 3. Import (FULL reconciliation = replace existing docs) ---
echo "--- Triggering documents:import (FULL reconciliation) ---"
OP="$(curl -s -X POST "${AUTH[@]}" -H "Content-Type: application/json" \
  "${BRANCH}/documents:import" \
  -d "{\"gcsSource\":{\"inputUris\":[\"gs://${GCS_BUCKET}/metadata/principles-metadata.jsonl\"],\"dataSchema\":\"document\"},\"reconciliationMode\":\"FULL\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('name',''))")"
[[ -n "${OP}" ]] || { echo "FAIL: no operation returned" >&2; exit 1; }
echo "  operation: ${OP##*/}"

# --- 4. Poll until documents land ---
echo "--- Waiting for documents to reconcile ---"
for i in $(seq 1 20); do
  sleep 15
  COUNT="$(curl -s "${AUTH[@]}" "${BRANCH}/documents?pageSize=25" \
    | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('documents',[])))" 2>/dev/null || echo 0)"
  echo "  poll ${i}: ${COUNT} document(s)"
  [[ "${COUNT}" -ge "${#DOCS[@]}" ]] && break
done

# --- 5. Verify search returns hits (indexing may lag a little after import) ---
echo "--- Verifying search returns hits ---"
for i in $(seq 1 10); do
  HITS="$(curl -s -X POST "${AUTH[@]}" -H "Content-Type: application/json" \
    "${BASE}/servingConfigs/default_config:search" \
    -d '{"query":"photography landscape composition lighting technique","pageSize":5}' \
    | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('results',[])))" 2>/dev/null || echo 0)"
  echo "  search poll ${i}: ${HITS} result(s)"
  if [[ "${HITS}" -ge 1 ]]; then
    echo ""
    echo "=== DONE — Discovery Engine returns ${HITS} hits. Grounding is live. ==="
    echo "Verify end-to-end: curl \$API_URL/health/grounding-probe  (expect source: discovery_engine)"
    exit 0
  fi
  sleep 20
done

echo ""
echo "WARN: documents imported but search not returning hits yet (indexing can lag)."
echo "      Re-check shortly: \$API_URL/health/grounding-probe"
