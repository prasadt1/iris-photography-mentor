#!/usr/bin/env bash
# Export docs/diagrams/*.mmd → docs/devpost-public/diagram-*.png (Kroki API)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIAGRAMS="$ROOT/docs/diagrams"
OUT="$ROOT/docs/devpost-public"

mkdir -p "$OUT"
for f in "$DIAGRAMS"/*.mmd; do
  name=$(basename "$f" .mmd)
  out="$OUT/diagram-${name}.png"
  echo "Exporting diagram-${name}.png ..."
  curl -sf -X POST "https://kroki.io/mermaid/png" \
    -H "Content-Type: text/plain" \
    --data-binary @"$f" \
    -o "$out"
done
echo "Done. Files in $OUT/diagram-*.png"
