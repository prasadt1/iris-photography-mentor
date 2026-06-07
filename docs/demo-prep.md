# Demo prep — recording & judge walkthrough

**Status:** Planning only — **not implemented yet.**  
Use this doc to decide what to build before Devpost / judge recordings. Remove or gate anything marked **TEMP** after the demo is captured.

**Related:** [`demo-script.md`](demo-script.md) · [`demo-video-script-3min.md`](demo-video-script-3min.md) · [`ios-demo-recording-checklist.md`](ios-demo-recording-checklist.md) · [`deploy.md`](deploy.md) (seed + `DEMO_USER_ID`)

---

## Goals

| # | Need | Why |
|---|------|-----|
| 1 | **Indoor / at-home practice briefs** | Weather-independent recording; avoid “go on a nature walk” assignments that I can’t film reliably |
| 2 | **Judge path without uploading** | Judges may not want to upload; library should already feel populated from MongoDB |
| 3 | **Empty / first-time user view** | Show onboarding + zero-library UX without wiping production demo data |

---

## What already exists (no new code required for basics)

| Capability | How it works today |
|------------|-------------------|
| **Pre-seeded judge library** | `make seed-demo` → MongoDB user `6577a1f2b3c4d5e6f7a8b9c0` (`DEMO_USER_ID`). Portfolio entries use HTTPS image URLs (Unsplash); **no upload needed** to browse My Work, scores, Glass Box, Mentor. |
| **Demo auth (web)** | Firebase not configured → implicit demo mode; API uses server `DEMO_USER_ID` when no signed-in user. |
| **Demo auth (iOS)** | “Continue in demo mode” → same server `DEMO_USER_ID`. |
| **Returning vs pitch Home** | `HomeTab` shows capability pitch when library is empty; personal hero when photos exist. |
| **Onboarding** | Persona picker (`OnboardingScreen`) + optional tour (`OnboardingTour`); gated by `iris_onboarding_done` in `localStorage` / server preferences. |
| **Active practice in seed** | `seed-demo-data.py` inserts one **active** assignment (side lighting / still-life) and one **completed** (rule of thirds). |

**Judge no-upload path (today):** Open https://iris-photo-mentor.web.app → use demo library → Home / My Work / Mentor / Practice. Photos live in **MongoDB Atlas** (`practice_companion.portfolio_entries`), not only in the browser.

---

## 1. Indoor / at-home practice exercises (TEMP)

### Problem

LLM-proposed assignments can mention outdoor walks, golden hour, etc. That’s bad for a controlled demo if weather or location doesn’t cooperate.

### Proposed approach (pick one)

**Option A — Extend seed script (fastest, recommended for recording)**  
Add a third assignment (status `proposed` or `active`) with fixed indoor briefs, e.g.:

- *“Window light portrait at home — place your subject beside a window, expose for the face, one third negative space.”*
- *“Kitchen still life — one object, 45° side light from a desk lamp, clean background.”*
- *“Leading lines indoors — use a hallway or staircase; shoot from low angle.”*

Also surface a **Home card** (“Today’s practice — shoot at home”) that deep-links to Practice, same as active assignment CTA.

**Option B — Demo-only propose override (API flag)**  
`POST /assignments/propose?demo_preset=indoor` returns canned briefs from a JSON fixture instead of Vertex. Gate with env `DEMO_INDOOR_PRESET=1` on Cloud Run; **remove after recording**.

**Option C — Frontend-only fixture (web only)**  
`?demo=indoor` injects mock assignment into Practice tab without persisting. Easiest for a single take; iOS wouldn’t match unless duplicated.

### Suggested default

**Option A + Home prominence** for recording; delete or `--reset` seed after Devpost.

### Cleanup after recording

- [ ] Remove indoor-only assignments from seed script **or** re-run `make seed-demo` without them
- [ ] Turn off `DEMO_INDOOR_PRESET` if Option B was used
- [ ] Re-enable normal LLM propose for production demos

---

## 2. Judge demo flow (no upload required)

### Recommended script (5–7 min)

1. **Land** on https://iris-photo-mentor.web.app (or iOS demo mode).
2. **Home** — hero photo, assignment card, mentor one-liner (seeded data).
3. **My Work** — scroll library; open one photo → Glass Box / scores (already in MongoDB).
4. **Mentor** — ask a starter question (*“What should I practice next?”*); show portfolio-aware reply (30–90s).
5. **Practice** — show active indoor-friendly assignment; accept/complete optional.
6. **Optional upload** — only if judge wants to see live analysis: one Studio upload (30–60s).

### If judge asks “where are the photos?”

> Photos are stored in **MongoDB Atlas** per user. The public demo uses a pre-seeded account (`DEMO_USER_ID`) so you can explore memory and mentor without uploading.

### Optional enhancements (not built yet)

| Enhancement | Purpose |
|-------------|---------|
| **`/docs/judge-quickstart.html`** or GitHub Pages section | One-page “click here” path with screenshots |
| **Settings → “Judge tour”** | Starts `OnboardingTour` + navigates tabs in order |
| **Deep link `?judge=1`** | Skips onboarding, lands on Home with a dismissible banner: *“Demo library — no sign-in required”* |
| **Playground** (`make playground`) | Agent graph for technical judges; separate from hosted UI |

### Data assumptions

- Production Cloud Run must have `DEMO_USER_ID=6577a1f2b3c4d5e6f7a8b9c0` and CORS for `iris-photo-mentor.web.app`.
- Re-seed before judging window: `make seed-demo` (add `--reset` if library was curated down to 11 photos).

---

## 3. Empty / first-time user view

### Problem

I need to **show** onboarding and empty Home/My Work **without** deleting the seeded judge library or signing out in a awkward way.

### Proposed approaches (pick one or combine)

**Option A — URL query flag (web, TEMP)**  
`?demo=empty` or `#home?empty=1`:

- Force onboarding screen (ignore `iris_onboarding_done` for session)
- Mock `photoCount = 0`, empty Practice, pitch Home (capability cards + example hero)
- Banner: *“Empty-state preview — remove `?demo=empty` for full library”*

**Option B — Settings developer toggle (web + iOS, TEMP)**  
Hidden behind Settings long-press or `?dev=1`:

- **“Preview: first-time user”** → clears local onboarding flags + uses empty API scope (new ephemeral user id **or** read-only empty fixture)
- **“Restore: judge demo”** → resets to `DEMO_USER_ID` / demo mode

**Option C — Second Mongo user (cleanest for real empty API)**  
Seed script adds `EMPTY_DEMO_USER_ID` with **zero** portfolio entries. Settings or URL switches `X-User-Id` to that hex. Judge library and empty library coexist in Atlas.

**Option D — Incognito + no seed (weakest)**  
New Google sign-in → real empty user. Slow (onboarding + empty mentor). Not ideal live.

### Suggested default

**Option A for video** (fast, reversible) + **Option C** if I want Mentor/Practice to truly return empty API responses on camera.

### What to show in empty-state recording

1. Persona onboarding (*Hobbyist* vs *Working pro*)
2. Home pitch (capabilities, example photo — already in `HomeTab`)
3. My Work empty state
4. Practice “Propose new challenge” empty queue
5. Mentor starters with *“upload photos first”* tone (if API returns empty portfolio)

### Cleanup

- [ ] Remove `?demo=empty` handler
- [ ] Remove Settings preview toggle
- [ ] Drop `EMPTY_DEMO_USER_ID` from seed if created

---

## Implementation checklist (when ready to build)

Priority order for **minimum demo confidence**:

1. [ ] **Indoor assignments in seed** + Home card copy (“Practice at home”)
2. [ ] **Judge quickstart** blurb in README / Devpost + verify `make seed-demo` on prod Atlas
3. [ ] **`?demo=empty`** (or Settings toggle) for first-time UX recording
4. [ ] Record web + iOS using [`ios-demo-recording-checklist.md`](ios-demo-recording-checklist.md)
5. [ ] **TEMP cleanup** — revert flags, re-seed judge library

---

## Open decisions

| Question | Options |
|----------|---------|
| Indoor briefs: seed only vs API preset? | Seed only for hackathon speed |
| Empty state: fake UI vs real empty user? | Fake for video; real empty user for honesty if judges ask |
| Show empty state in same Devpost video or separate clip? | Separate 30s clip often cleaner |
| iOS parity for `?demo=empty`? | URL doesn’t apply; use Settings toggle or second demo account |

---

## Recording day checklist

- [ ] `curl https://practice-companion-api-l6kusl5xcq-uc.a.run.app/health` → OK
- [ ] `make seed-demo` against production `MONGODB_URI` (if library stale)
- [ ] Hard refresh web app (service worker / favicon)
- [ ] iOS: demo mode → confirm portfolio loads
- [ ] Weather-agnostic practice brief visible on Home / Practice
- [ ] Script empty-state segment with `?demo=empty` (after implemented)
- [ ] After capture: run **TEMP cleanup** section above

---

*Last updated: planning pass — no demo flags shipped in app yet.*
