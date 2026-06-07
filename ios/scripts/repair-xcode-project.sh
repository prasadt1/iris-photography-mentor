#!/usr/bin/env bash
# Fix "Unknown error" when opening Iris.xcodeproj — cleans user state and regenerates.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v xcodegen >/dev/null 2>&1; then
  echo "Install xcodegen: brew install xcodegen" >&2
  exit 1
fi

if [[ "$(xcode-select -p 2>/dev/null)" != *"Xcode.app"* ]]; then
  echo "Point xcode-select at full Xcode (not Command Line Tools):" >&2
  echo "  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer" >&2
  exit 1
fi

echo "Cleaning Xcode user state…"
rm -rf Iris.xcodeproj/project.xcworkspace/xcuserdata
rm -rf Iris.xcodeproj/xcuserdata

echo "Regenerating Iris.xcodeproj from project.yml…"
xcodegen generate

# xcodegen omits compatibilityVersion; Xcode GUI needs it for objectVersion 77.
python3 - <<'PY'
from pathlib import Path
p = Path("Iris.xcodeproj/project.pbxproj")
text = p.read_text()
if "compatibilityVersion" not in text:
    text = text.replace(
        "buildConfigurationList = 264E0FA4B9D5BDA7E5D78C8B /* Build configuration list for PBXProject \"Iris\" */;\n\t\t\tdevelopmentRegion = en;",
        "buildConfigurationList = 264E0FA4B9D5BDA7E5D78C8B /* Build configuration list for PBXProject \"Iris\" */;\n\t\t\tcompatibilityVersion = \"Xcode 16.0\";\n\t\t\tdevelopmentRegion = en;",
    )
text = text.replace("LastUpgradeCheck = 1430;", "LastUpgradeCheck = 2650;")
p.write_text(text)
scheme = Path("Iris.xcodeproj/xcshareddata/xcschemes/Iris.xcscheme")
if scheme.is_file():
    scheme.write_text(scheme.read_text().replace('LastUpgradeVersion = "1430"', 'LastUpgradeVersion = "2650"'))
print("Patched project metadata for current Xcode.")
PY

echo "Validating…"
plutil -lint Iris.xcodeproj/project.pbxproj >/dev/null
xcodebuild -list -project Iris.xcodeproj >/dev/null

echo ""
echo "Opening Iris.xcodeproj…"
open Iris.xcodeproj
