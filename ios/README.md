# Iris — iOS (SwiftUI)

**Display name:** Iris · **Bundle ID:** `com.prasadtilloo.practicecompanion`

**IA:** Home · Practice · Mentor · Settings + **Shoot FAB**. Shares Cloud Run API with web. Detailed product notes: local `docs/ios-product-spec.md` (gitignored).

| Phase | Status |
|-------|--------|
| **0** | Tab shell, API client, Practice propose/accept/complete |
| **1** | Shoot FAB → camera/gallery → `analyze-photo` (assignment optional) |
| **1.5** | Home: trends, recent photos, active practice card |
| **2** | Practice: propose/accept/complete, Shoot for this |
| **2.5** | Mentor chat (`POST /api/v1/agent/chat`) |
| **3** | Firebase Google Sign-In + persona onboarding |
| **A** | Decline, reflection sheet, persona in Settings, app icon, offline banner |
| **3.5+** | Live Field Coach — `capture_sessions` + `field_capture` on API |
| **4** | iOS live coach: periodic frames, cue overlay, voice, Ask Iris |

Full iOS roadmap: local `docs/ios-implementation-plan.md` (private; see root `.gitignore`).

---

## Prerequisites

- **Mac** with **Xcode 15+** (full app, not Command Line Tools only)
- Apple Developer account (for device / TestFlight)
- Same Firebase project as web (Phase 0.5)

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

---

## Open the project

If Xcode shows **Unknown error**, run the repair script first (cleans stale user data and regenerates the project):

```bash
cd ios
chmod +x scripts/repair-xcode-project.sh
./scripts/repair-xcode-project.sh
```

Normal workflow:

```bash
cd ios
brew install xcodegen   # once
xcodegen generate       # regenerates Iris.xcodeproj from project.yml
open Iris.xcodeproj
```

1. Select the **Iris** scheme → iPhone simulator or your device  
2. **Signing & Capabilities** → set your **Team**  
3. Run (⌘R)

---

## API configuration

`Config/Debug.xcconfig` and `Release.xcconfig` set:

```text
API_BASE_URL = https://practice-companion-api-l6kusl5xcq-uc.a.run.app
```

Override in Xcode: target **Iris** → Build Settings → `API_BASE_URL`.

---

## Sign-in & persona (Phase 3)

**First launch:** Sign in with Google **or** Continue in demo mode → choose **Hobbyist** or **Working pro** → main app.

### Enable Google Sign-In (one-time)

1. Firebase Console → project **practice-companion-hackathon** → add **iOS app** with bundle ID `com.prasadtilloo.practicecompanion`.  
2. Download **`GoogleService-Info.plist`** → save as **`ios/GoogleService-Info.plist`** (same folder as `Iris.xcodeproj`).  
   Then run `cd ios && xcodegen generate` — no drag-and-drop needed.  
   Template: `ios/GoogleService-Info.plist.example`  
   **Or in Xcode:** Project navigator (folder icon) → **File → Add Files to "Iris"…** → pick the plist → **Copy items if needed** + target **Iris** only.  
3. Open `ios/Iris/Info.plist` → replace `com.googleusercontent.apps.REPLACE_WITH_REVERSED_CLIENT_ID` with the **`REVERSED_CLIENT_ID`** value from your plist (URL Types → URL Schemes).  
4. Enable **Google** provider under Firebase Authentication.  
5. `cd ios && xcodegen generate` → build in Xcode.

Without the plist, the app still runs in **demo mode** (same as web without Firebase env).

### Demo / developer

- **Continue in demo mode** on sign-in (server `DEMO_USER_ID` when configured).  
- In demo, **Settings → Developer** still allows pasting a Firebase uid to match web portfolio.

---

## Project layout

```text
ios/
  project.yml          # XcodeGen source
  Iris.xcodeproj/      # generated — commit after xcodegen
  Config/              # API_BASE_URL xcconfig
  Iris/
    App/               # IrisApp, ContentView (tabs)
    Core/              # APIClient, models, AuthViewModel, AppState
    Features/          # Field, Practice, Mentor, Settings
    Design/            # irisColors (warm amber)
    Resources/         # Assets.xcassets
```

---

## Verify API from simulator

On launch you should see a brief banner **API OK · phase …** if Cloud Run is reachable.

---

## UI (web parity — warm gallery)

Dark **canvas** + **amber** brand, serif titles, bordered cards, score bars, and Glass Box tabs — aligned with `frontend/src/index.css`. **C2/C3** add radar chart, spatial overlays, and bundled Newsreader + DM Sans. Not yet: full “How to Fix” tab parity with web Studio.

### Test C2 · C3 · C5 (device recommended)

Regenerate and open after pulling:

```bash
cd ios && xcodegen generate && open Iris.xcodeproj
```

| Item | Where | What to verify |
|------|--------|----------------|
| **C5 Horizon** | Shoot FAB → viewfinder | Amber dashed line tilts with phone roll; turns **solid green** when level (~±2°). Simulator motion is limited — use a **physical iPhone**. |
| **C2 Radar** | Shoot → capture → critique sheet → **Overview** | Pentagon **radar chart** above score bars (composition, lighting, technique, creativity, subject impact). |
| **C2 Spatial** | Same critique sheet, photo preview | Colored boxes on image when API returns `spatial_metadata.annotations` (landscape / architecture shots work best). |
| **C3 Fonts** | Home title, critique headline, Mentor | Serif headlines = **Newsreader**; body = **DM Sans** (not system Georgia / SF). If fonts fail to load, Iris falls back to system serif/sans — rebuild after `xcodegen generate` so `.ttf` files are in the app bundle. |

Quick font check in Xcode debug console after launch:

```swift
po UIFont(name: "Newsreader16pt16pt-Bold", size: 17)
po UIFont(name: "DMSans9pt-Regular", size: 17)
```

Both should print a font object, not `nil`.

## Shoot (Phase 1)

1. Tap **Shoot** (amber FAB) from Home, Practice, or Mentor — no assignment required.  
2. **Pinch** the viewfinder to zoom (up to 5×); **double-tap** to reset to 1×. Badge shows current zoom.  
3. Full-height viewfinder in Shoot — shutter and Gallery sit below.  
4. Shutter (device) or **Gallery** (simulator).  
5. **Live coach** (device, online): cues every ~3s; **Ask Iris** for immediate feedback; toggle in Settings.

## Live coach (Phase 4)

Requires network. Starts a `capture_sessions` doc, sends preview frames to `POST /api/v1/agent/field_capture`, shows `onScreenHint` and optional voice (`Settings → Live field coach`).
3. Analyze overlay with tips + **Cancel** (~30–90s).  
4. Critique sheet → optional link to active practice via `assignment_id`.

## Home / Mentor (1.5 / 2.5)

- **Home:** progress from `/portfolio/trends`, recent photos, active practice card, link to web portfolio.  
- **Mentor:** real chat with local message history + server `sessionId`.  
- **Practice:** badge for proposed count; **Shoot for this** on active assignment.

## Next steps

- [ ] Test **C2 / C3 / C5** on physical iPhone (see table above)
- [ ] Test Google sign-in on physical iPhone (optional for demo)
- [ ] Record demo: [`docs/ios-demo-video-script.md`](../docs/ios-demo-video-script.md)
- [ ] Live Field Coach polish (Phase 3.5+)

---

## Regenerate project

After editing `project.yml` or adding Swift files:

```bash
cd ios && xcodegen generate
```

---

## Xcode warnings and device errors

### “All interface orientations must be supported…” / “launch storyboard must be provided…”

`project.yml` sets a generated launch screen, portrait-only iPhone orientations, and `UIRequiresFullScreen`. After pulling changes, run `xcodegen generate`, then **Product → Clean Build Folder** (⇧⌘K) and build again.

### `dyld_shared_cache_extract_dylibs failed` (Code 908)

This is an **Xcode ↔ device symbols** issue, not your Swift code. The app often still installs; the debugger fails to attach.

Try in order:

1. **Simulator first** (iPhone 16) to confirm the build is fine.  
2. On the physical iPhone: unplug/replug, unlock, trust the Mac, **Developer Mode** on.  
3. Xcode → **Window → Devices and Simulators** → select the device → wait for symbol processing to finish.  
4. **Delete Derived Data**: Xcode → Settings → Locations → Derived Data → arrow → delete `Iris-*` folder.  
5. Quit Xcode, run: `rm -rf ~/Library/Developer/Xcode/iOS\ DeviceSupport/*` (forces re-download of device support; slow once).  
6. Reboot the iPhone and Mac if it persists.  
7. Update Xcode to the latest patch for your iOS version.

If run still fails on device: **Product → Run** with debugger detached is not built-in; use **Run without debugging** is not standard — instead try **Release** scheme on device, or use Simulator until symbols finish indexing.

### “Paused Iris on PT iPhone” in `.nasm` / system code

Debugger stopped in Apple framework code — press **Continue** (▶) in Xcode; check the phone for the Iris UI.
