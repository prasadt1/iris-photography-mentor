#!/usr/bin/env bash
# Verify Aftershoot supplementary items B + C (item A folder-drop intentionally skipped).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }
pass() { echo "PASS: $*"; }

METRIC_RE='sub-agent compositions|MongoDB-backed memory layer'
POS_RE='Aftershoot'
FRAME_RE='coexist|complement|fits into'

for f in README.md docs/demo-script.md docs/devpost-draft.md; do
  test -f "$f" || fail "missing $f"
  grep -qE "$METRIC_RE" "$f" || fail "value-prop metric missing from $f"
  pass "metric in $f"
done

grep -qE "$METRIC_RE" docs/spec.md || fail "metric missing from docs/spec.md §11 plan"
pass "metric in docs/spec.md"

for f in README.md docs/mongodb-story-document.md docs/devpost-draft.md docs/spec.md; do
  grep -q "$POS_RE" "$f" || fail "positioning (Aftershoot mention) missing from $f"
  grep -qE "$FRAME_RE" "$f" || fail "complement framing missing from $f"
  pass "positioning in $f"
done

echo ""
echo "Item A (folder-drop): SKIPPED by design — use Studio uploads + Label Photos scan on seeded library."
echo "All B + C checks passed."
