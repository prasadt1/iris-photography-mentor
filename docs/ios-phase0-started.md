# iOS Phase 0 — started

**Date:** May 27, 2026

## Shipped in repo

- `ios/project.yml` + **XcodeGen** → `ios/Iris.xcodeproj`
- SwiftUI app: **Field** · **Practice** · **Mentor** (placeholder) · **Settings**
- `APIClient` with `X-User-Id` (mirrors web `apiFetch`)
- `PracticeService`: assignments list, active, accept, complete, `/health`
- Warm amber design tokens (`IrisColors.swift`)
- API base URL via xcconfig → `APIBaseURL` in Info.plist

## Manual on your Mac

1. `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`
2. `cd ios && xcodegen generate && open Iris.xcodeproj`
3. Set signing **Team** → Run on simulator
4. Paste Firebase uid in Settings (or demo scope)

## Not in Phase 0

- Camera / analyze-photo (Phase 1)
- Firebase iOS SDK (Phase 0.5)
- `field_capture` live coaching (Phase 2–3)

See [`ios/README.md`](../ios/README.md).
