#!/usr/bin/env bash
# Deploy ADK Agent Engine runtime (E1 scaffold — optional prod path alongside Cloud Run).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/app"

PROJECT="${GOOGLE_CLOUD_PROJECT:-practice-companion-hackathon}"
LOCATION="${GOOGLE_CLOUD_LOCATION:-us-central1}"
STAGING_BUCKET="${AGENT_ENGINE_STAGING_BUCKET:-gs://${PROJECT}-agent-engine-staging}"

echo "==> Agent Engine deploy scaffold"
echo "    Project:  $PROJECT"
echo "    Location: $LOCATION"
echo "    Staging:  $STAGING_BUCKET"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud required" >&2
  exit 1
fi

# Ensure staging bucket exists (idempotent).
if ! gsutil ls "$STAGING_BUCKET" >/dev/null 2>&1; then
  echo "Creating staging bucket $STAGING_BUCKET"
  gsutil mb -l "$LOCATION" "$STAGING_BUCKET"
fi

echo ""
echo "Next: deploy with Vertex AI Agent Engine ADK template."
echo "  cd app && uv run python -m orchestrator.agent_runtime_app  # local smoke"
echo "  See docs/deploy.md § Agent Engine for full gcloud / console steps."
echo ""
echo "Cloud Run remains the production Mentor + Coach API unless you cut over DNS."
