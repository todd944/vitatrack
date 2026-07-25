# VitaTrack — starter build

A safety-focused vitamin/supplement tracker. This is a working prototype
covering **build order steps 1–5 and 8**: a 75-item cited supplement
library with camera barcode scanning, calendar scheduling with reminders
and adherence streaks, goal-based onboarding, a curated interaction/
safety-check engine (66 medication/supplement interactions, 27
condition-based cautions, RxNorm-backed medication search, FDA recall
lookup), a mood/energy outcome log, and single-device persistence via
localStorage. There's no backend, no accounts, and no multi-device sync
yet — see step 6 and `SUPABASE_MIGRATION.md` for the scoped plan.

## Run it

This project wasn't installed/built in the sandbox it was created in
(no network access there). To run it:

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`).

## Recommended: hand this to Claude Code next

This chat is good for planning and scaffolding; Claude Code is the better
tool for the actual build-test-fix loop from here, because it can run the
dev server, see real error output, and iterate without you copy-pasting
code back and forth. Point Claude Code at this folder and continue with
the build order below.

## Build order status

- [x] **1. Vitamin library + calendar** — done. 75 supplements (all 13 NIH
      ODS vitamins, 15 minerals, herbals, and sports-nutrition items), each
      with DRI-personalized dosing, real citations, and goal-based surfacing.
- [x] **2. Goal-based onboarding + outcome tracking** — done.
- [x] **3. Curated interaction table** — 66 interaction entries + 27
      condition-based cautions. Still needs a pharmacist/clinical review
      pass before this reaches real users (see below) — "curated by an AI
      coding assistant" is not the same as clinically reviewed.
- [x] **4. Medication input + interaction flagging** — done. Medication
      search is backed by RxNorm's `approximateTerm` endpoint (typo-tolerant,
      suggests real drug names) instead of blind free-text; a manual-entry
      fallback still exists for anything RxNorm doesn't recognize.
- [x] **5. Single-device persistence** — done via `useLocalStorageState`
      (`src/lib/useLocalStorageState.js`). Schedule, history, profile, and
      medications now survive a refresh. This does **not** cover multi-device
      sync or push notifications while the app is closed — both need an
      actual backend, see step 6.
- [ ] **6. Real backend (accounts + sync + push)** — scoped, not built. See
      `SUPABASE_MIGRATION.md` for the full schema, auth strategy, migration
      approach, and a Phase 1 (accounts + sync) / Phase 2 (push
      notifications) split. Needs your own Supabase project to start.
- [ ] **7. Real interaction API** — once you have paying users, revisit
      licensing a commercial interaction API to broaden coverage beyond the
      curated table (see prior conversation for the current landscape —
      RxNav's free interaction API and DrugBank's free checker are both
      discontinued as of 2026).
- [x] **8. Barcode scanning** — done. Camera-based UPC/EAN scan via
      `@zxing/browser` (`src/components/BarcodeScanner.jsx`), resolved to a
      product name via Open Food Facts's API (`src/lib/barcodeLookup.js`),
      fuzzy-matched against the bundled library (falls back to the existing
      custom-product flow, pre-filled with the scanned name, on no match).
      Note: UPCitemdb was tried first and doesn't work — its trial API
      doesn't send CORS headers, so it fails silently from a browser. Open
      Food Facts does support CORS but is food/grocery-centric, so some
      supplement barcodes won't resolve; that's an expected miss handled by
      the same custom-product fallback, not a bug.

## Before you launch: things that need a human, not just code

- **Have a pharmacist or clinician review the interaction table**
  (`src/data/interactions.js`, `src/data/conditionCautions.js`) before this
  reaches real users. It's grown to 66 interaction entries and 27
  condition-based cautions, each citation-backed, but that's still "curated
  by an AI coding assistant working from public fact sheets," not a
  reviewed clinical dataset.
- **Legal review of the disclaimers and terms of service.** The in-app
  banner and onboarding consent are a good foundation, not a substitute for
  an actual liability review given this touches health data. The Privacy
  Policy now needs to accurately describe localStorage persistence (done)
  and will need another pass once a real backend/accounts layer is added.
- **Decide on data privacy handling for the backend migration** — data is
  currently local-only (in the browser, this device, no server). Once
  Supabase or another backend is added, plan for encryption at rest and a
  clear data-deletion path (HIPAA likely doesn't apply since this isn't a
  covered entity, but state health-data privacy laws increasingly do, e.g.
  Washington's My Health My Data Act).

## Suggested tool stack going forward

**Core dev loop**
- **Claude Code** (desktop, terminal, or VS Code extension) — for the
  iterative build/run/debug loop from here
- **VS Code** — if you want a familiar editor alongside Claude Code's
  terminal/VS Code extension integration
- **GitHub** — version control; also required for most CI/CD and easy
  deploys to Vercel/Netlify

**Backend & data**
- **Supabase** — Postgres + auth + row-level security, generous free tier;
  see `SUPABASE_MIGRATION.md` for the scoped schema and migration plan
- **RxNorm API** (still free) — for normalizing medication name input
- **Open Food Facts API** (still free) — for barcode-to-product lookup

**Deployment**
- **Vercel** or **Netlify** — free tier, deploys straight from GitHub,
  minimal config for a Vite/React app like this one

**Payments (when you're ready to monetize)**
- **Stripe** — for the freemium subscription model discussed earlier
- **RevenueCat** — only needed if/when you go native mobile (handles
  App Store/Play Store subscription complexity)

**Quality & monitoring**
- **Sentry** (free tier) — error tracking once real users are on it;
  valuable early for a health-adjacent app where silent failures matter
- **Postman** or **Bruno** — for testing API integrations (RxNorm,
  eventually a commercial interaction API) outside the app itself

**Design**
- **Figma** — if you want to mock up screens before Claude Code builds
  them, or hand off to Claude Design for polish once you have real content
