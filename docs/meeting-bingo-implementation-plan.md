# Meeting Bingo — Implementation Plan

**Version**: 1.0
**Date**: 2026-06-23
**Status**: Ready to build
**Source documents**: [PRD](./meeting-bingo-prd.md) · [Architecture](./meeting-bingo-architecture.md) · [UXR](./meeting-bingo-uxr.md)
**Build target**: Functional MVP (single-player), ~90 minutes of focused work

---

## Review Summary

**Reviewed**: 2026-06-23 · **Reviewers**: VP Product, VP Engineering, VP Design (multi-perspective plan review)

| # | Severity | Issue | Change applied |
|---|----------|-------|----------------|
| C1 | Critical | No word→square mapping for auto-fill | Added `findSquareByWord` requirement (§4 #11, Phase 1, Phase 3) |
| C2 | Critical | `winningWord` never computed | Defined winningWord contract (§4 #12, Phase 3) |
| C3 | Critical | Color-only square states (WCAG 1.4.1) | Added non-color state cues (§4 #13) |
| C4 | Critical | No aria-live for auto-fill/detected | Added aria-live requirement (§4 #14) |
| H1 | High | filledCount drift | Derive from `countFilled` (§4 #15) |
| H2 | High | `api`→`interface` false match | Removed alias / boundary match (§4 #16) |
| H3 | High | Restored mic auto-starts | Never persist isListening:true (§4 #17, Phase 4) |
| H4 | High | No metrics instrumentation | Documented as deferred (§9 note, §11) |
| H5 | High | System/meeting audio capture | Elevated to explicit risk (§10) |
| H6 | High | PRD vs arch filled color conflict | Resolved to bg-blue-500 (§4 #18) |
| H7 | High | Permanent animate-pulse | One-shot pulse (§4 #19, Phase 3) |
| H8 | High | No prefers-reduced-motion | Added motion guard (§4 #20, Phase 4) |
| H9 | High | Card preview/regenerate dropped | Documented decision (§11) |
| H10 | High | "One away" lacks completing word | Extended getClosestToWin (§4 #21, Phase 3) |
| M1 | Medium | Dead dotted aliases | Removed (§4 #16) |
| M2 | Medium | No persistence versioning | Added version+guard (§4 #17) |
| M3 | Medium | Transient errors kill listening | Classify errors (§4 #22) |
| M4 | Medium | Unbounded transcript | Cap stored transcript (§4 #22) |
| M5 | Medium | start()/onend race | Ref-based restart guard (§4 #22) |
| M6 | Medium | (window as any) / no CSP | Added types + CSP note (§4 #22) |

**Unresolved items (deferred or needing sign-off):**
- [ ] H4 — Analytics/metrics instrumentation deferred to post-MVP; success metrics validated manually.
- [ ] H9 — Card preview + regenerate-before-start: in-game "New Card" accepted as MVP substitute (PM to confirm US-1.3).
- [ ] M7 — Screenshot/image share card deferred; MVP ships text+link only.
- [ ] M8 — Cross-browser (Safari/Edge) smoke test beyond Chrome.

---

## 1. Purpose

This document turns the PRD, Architecture Plan, and UXR into a concrete, sequenced build plan: what to create, in what order, with acceptance criteria mapped back to the source requirements. It also resolves the inconsistencies and gaps found across the three documents so there are no decisions left to make mid-build.

---

## 2. Scope (locked)

**In scope — MVP (single-player, no backend):**

- Landing page → category selection → active game → win screen flow
- 5×5 card generation (24 random words + center free space) from 3 buzzword packs (Agile, Corporate, Tech)
- Manual square toggle (tap to fill/unfill)
- BINGO detection (5 rows, 5 columns, 2 diagonals)
- Web Speech API transcription with auto-fill on buzzword detection
- Live transcript panel + detected-word toasts
- "One away" near-bingo tension indicator (progress + highlight)
- Win celebration (confetti, winning-line highlight, stats) — **sound off by default**
- Share result (clipboard + native share sheet)
- localStorage persistence of the in-progress game (P1)
- Mobile-responsive layout (P1)

**Out of scope — explicitly deferred (see §11):**
Accounts/auth · multiplayer / "Join Game" · custom buzzword packs · leaderboards · backend/database · sound effects on by default · game history beyond current session · calendar integration · dark mode (P2, only if time remains).

> Note: The UXR storyboards show "Join Game", a "Custom" pack, and leaderboards. These are **vision-level** features and are **not** part of the MVP per the PRD §2.2. They are parked in §11.

---

## 3. Tech stack (from Architecture §"Architecture Decisions")

| Layer | Choice | Version |
|-------|--------|---------|
| Framework | React + TypeScript | 18.2 |
| Build | Vite | 5.x |
| Styling | Tailwind CSS | 3.3 |
| Speech | Web Speech API (browser-native) | — |
| Animation | CSS + `canvas-confetti` | 1.9 |
| State | React `useState` + props (Context optional) | — |
| Persistence | `localStorage` | — |
| Deploy | Vercel (static) | — |

Cost: **$0/month**. No API keys, no server.

---

## 4. Resolved decisions & gaps (read before coding)

These reconcile conflicts/omissions across the three docs:

1. **State management — use props, not Context.** The Architecture file tree lists `context/GameContext.tsx`, but the provided `App.tsx` drives everything with `useState` + prop drilling. For an MVP this depth is shallow (≤2 levels). **Decision: skip `GameContext.tsx`.** Revisit only if prop drilling becomes painful.
2. **Add `src/lib/utils.ts`.** Components (`BingoSquare`, `TranscriptPanel`) import a `cn()` helper that isn't in the file tree. Create it: `clsx` + `tailwind-merge`, or a 3-line `cn(...args) => args.filter(Boolean).join(' ')`. **Decision: add `clsx` + `tailwind-merge`** (tiny, idiomatic). Update `package.json` deps accordingly.
3. **Tailwind `confetti` keyframe is undefined** in the architecture's `tailwind.config.js` (the animation references a missing keyframe). Celebration uses `canvas-confetti` (JS), so **remove the unused `confetti` animation entry** to avoid a build-time warning; keep `bounce-in` and `pulse-fast`.
4. **Auto-fill writes to card state, win check derives from it.** Detection → mark square `isFilled = true, isAutoFilled = true, filledAt = Date.now()` → run `checkForBingo`. `winningWord` = the last word that completed the line.
5. **"Already filled" guard.** Detection must skip words already filled (`detectWords` takes an `alreadyFilled: Set<string>`). Build that set from currently-filled, non-free squares each detection pass.
6. **Free space** is pre-filled at generation (center `2-2`), counts toward every line, and is not clickable.
7. **Speech auto-restart.** `onend` restarts recognition while `isListening` is true (Chrome stops after ~60s of silence). Keep the ref-based pattern from the architecture; guard against `InvalidStateError` on double-start.
8. **Performance budget (UXR §Technical Requirements):** card render < 100ms, auto-fill visible < 500ms after the word, no jank on confetti. Detection runs only on **final** transcript results, not interim, to limit work.
9. **Privacy copy is a feature, not a nicety (UXR Principle 4).** The mic-enable step must show: *"Audio is processed locally on your device and is never recorded or sent to any server."* Gate listening behind an explicit enable action.
10. **Firefox / unsupported speech:** feature-detect. If unsupported, hide the listen toggle, show a one-line notice, and the game remains fully playable via manual tap (PRD risk table).
11. **Detected word → square mapping (C1).** `detectWords` returns words from the flat `card.words`; auto-fill needs the square. Build a `wordToSquare: Map<string,[row,col]>` at `generateCard` (key = `word.toLowerCase()`), or add `findSquareByWord(card, word)` in `bingoChecker.ts`. Auto-fill uses it to set `isFilled` on the matched square.
12. **`winningWord` (C2).** `checkForBingo` returns only the line. The fill handler that triggers the win supplies `winningWord` = the word just filled (manual click word or last detected word). `handleWin(line, winningWord)` is called from `GameBoard`, not derived inside `checkForBingo`.
13. **Square state needs a non-color cue (C3).** Filled vs winning must not rely on color alone (WCAG 1.4.1). Filled squares get a ✓ glyph (already have `line-through`); winning squares get a distinct ring + glyph; every square sets `aria-pressed={isFilled}` and an `aria-label` (e.g. `"sprint, filled"`).
14. **Auto-fill announcements (C4).** Add a visually-hidden `aria-live="polite"` region that announces `"<word> detected, square filled"` on each auto-fill; `WinScreen` announces "BINGO!" with `aria-live="assertive"`.
15. **`filledCount` is derived, not stored (H1).** Drop `filledCount` from persisted `GameState`; compute via `countFilled(card)` at render to avoid drift with `App.handleCategorySelect`/`handleWin`.
16. **Alias hygiene (H2/M1).** Remove `'api':['interface']` (substring matches "user interface"). Remove dotted aliases `'m.v.p.'`, `'r.o.i.'`, `'a.p.i.'` (never fire — speech emits no dots and `normalizeText` keeps periods). Match remaining single-token aliases with word boundaries; reserve substring matching for genuine multi-word phrases.
17. **Persistence safety (H3/M2).** Persisted `GameState` must NOT restore `isListening: true` (would auto-start mic with no gesture). Add a `version` field to the stored payload; on load, `try/catch` + shape-validate and fall back to a fresh game on mismatch. Always require an explicit enable action after restore.
18. **Filled-square color is `bg-blue-500` (H6).** The Architecture `BingoSquare` (`bg-blue-500` / white text) is authoritative over PRD §6.6 `--filled-square #dbeafe`. Verify white-on-#3b82f6 meets 4.5:1; note the PRD token is superseded.
19. **Auto-fill pulse is one-shot (H7).** `animate-pulse` keyed on `isAutoFilled` pulses forever (the flag is permanent). Use a transient `isNew` flag cleared after ~500ms (or a one-shot `bounce-in`) so squares settle; persistent motion is reserved for the near-win line only.
20. **Reduced motion (H8).** Gate confetti, pulse, and bounce-in behind `@media (prefers-reduced-motion: reduce)`; short-circuit `canvas-confetti` to a static highlight when reduced motion is set (supports UXR Moment 3 "discreet/professional").
21. **`getClosestToWin` returns the missing square (H10).** Extend it to also return the unfilled square(s)/word(s) of the closest line so the UI can render "Need: <word>" and highlight that square (UXR Moment 2), not just a line name + count.
22. **Speech hook hardening (M3/M4/M5/M6).** (a) In `onerror`, classify fatal (`not-allowed`, `service-not-allowed`) vs transient (`no-speech`, `aborted`, `network`); keep listening on transient, surface a notice on fatal. (b) Cap stored `transcript` (keep last ~500 chars) — detection runs on the `final` fragment only, so growth is unnecessary. (c) Move the `onend` restart out of the `setState` updater into a ref-flag + guarded `start()` to avoid `InvalidStateError`/restart loops and StrictMode double-invoke. (d) Add minimal Web Speech API type declarations instead of `(window as any)`/`any` refs; add a baseline CSP for the Vercel deploy.

---

## 5. Target project structure

```
meeting-bingo/
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx
    ├── App.tsx                  # screen state machine (landing/category/game/win)
    ├── index.css                # Tailwind directives + CSS vars
    ├── components/
    │   ├── LandingPage.tsx
    │   ├── CategorySelect.tsx
    │   ├── GameBoard.tsx
    │   ├── BingoCard.tsx
    │   ├── BingoSquare.tsx
    │   ├── TranscriptPanel.tsx
    │   ├── GameControls.tsx
    │   ├── WinScreen.tsx
    │   └── ui/
    │       ├── Button.tsx
    │       ├── Card.tsx
    │       └── Toast.tsx
    ├── hooks/
    │   ├── useSpeechRecognition.ts
    │   ├── useGame.ts            # optional helper; may stay inline in App for MVP
    │   └── useLocalStorage.ts    # P1
    ├── lib/
    │   ├── cardGenerator.ts
    │   ├── bingoChecker.ts
    │   ├── wordDetector.ts
    │   ├── shareUtils.ts
    │   └── utils.ts             # cn() helper  ← added (gap #2)
    ├── data/
    │   └── categories.ts
    └── types/
        └── index.ts
```

> `useBingoDetection.ts` and `GameContext.tsx` from the architecture tree are intentionally dropped for MVP (logic lives in `lib/bingoChecker.ts`, called from `GameBoard`).

---

## 6. Phased build plan

Phases are ordered so the app is runnable and demoable after **each** phase. Check off acceptance criteria (mapped to PRD user stories) before moving on.

### Phase 0 — Scaffold (≈10 min)

1. `npm create vite@latest . -- --template react-ts` (into this repo; preserve existing `docs/`, `README.md`, `.git`).
2. `npm install` then `npm install canvas-confetti clsx tailwind-merge`.
3. `npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p`.
4. Configure `tailwind.config.js` (content globs, `bounce-in`/`pulse-fast` keyframes; **omit** the broken `confetti` one — gap #3).
5. Replace `src/index.css` with Tailwind directives + the color CSS vars from PRD §6.6.
6. Delete Vite boilerplate (`App.css`, demo assets, counter).
7. Add `favicon.svg` (🎯).

**Done when:** `npm run dev` serves a blank styled page; `npm run build` and `npm run typecheck` pass clean.

### Phase 1 — Types + data + core logic (≈15 min)

Pure, testable modules first — no UI dependency.

1. `src/types/index.ts` — all interfaces from Architecture §"Core Type Definitions" (`Category`, `BingoSquare`, `BingoCard`, `GameState`, `GameStatus`, `WinningLine`, `SpeechRecognitionState`, `Toast`).
2. `src/data/categories.ts` — the 3 packs (each 40+ words) from Architecture §"Buzzword Data".
3. `src/lib/utils.ts` — `cn()` (gap #2).
4. `src/lib/cardGenerator.ts` — `generateCard()` (Fisher–Yates shuffle, 24 words + center free space) + `getCardWords()` + build a `wordToSquare` index (lower-cased word → `[row,col]`) for O(1) auto-fill lookup (gap #11).
5. `src/lib/bingoChecker.ts` — `checkForBingo()`, `countFilled()`, `getClosestToWin()`.
6. `src/lib/wordDetector.ts` — `detectWords()`, `WORD_ALIASES`, `detectWordsWithAliases()`.

**Acceptance (PRD US-1.3, US-3.3):**
- [ ] Card has 24 unique words + center free space; free space pre-filled.
- [ ] Regenerating produces a different card.
- [ ] `checkForBingo` finds all 12 lines (5 row, 5 col, 2 diag); free space counts.
- [ ] `detectWords` is case-insensitive, respects word boundaries for single words and substring for phrases, and skips already-filled words.

> Quick sanity check this phase with a scratch script or a couple of throwaway asserts in the console; formal tests are optional for the workshop MVP (see §9).

### Phase 2 — Shells + core game UI, manual play (≈25 min)

1. `src/components/ui/` — `Button`, `Card`, `Toast` (presentational).
2. `App.tsx` — screen state machine: `landing | category | game | win`; holds `GameState`; handlers `handleStart`, `handleCategorySelect`, `handleWin`, `handlePlayAgain`, `handleBackToHome` (per Architecture `App.tsx`).
3. `LandingPage.tsx` — hero, "New Game", privacy line, "How it works" (PRD §6.2).
4. `CategorySelect.tsx` — 3 `CategoryCard`s with icon, name, sample words, Select; Back (PRD §6.3).
5. `BingoSquare.tsx` + `BingoCard.tsx` — 5×5 grid; state styles for default/filled/auto-filled/free/winning (Architecture component code, PRD §6.6 colors).
6. `GameBoard.tsx` + `GameControls.tsx` — header (logo, status, `X/24` counter), card, New Card, (listen toggle wired in Phase 3).
7. Wire **manual toggle** → update square → `checkForBingo` → on win call `onWin`.
8. Basic `WinScreen.tsx` (stats + Play Again; confetti/share in Phase 4).

**Acceptance (PRD US-1.1, US-1.2, US-3.1, US-3.2, US-3.3):**
- [ ] Landing loads, "New Game" → category screen.
- [ ] 3 categories with sample-word previews; selecting generates a card and enters game.
- [ ] Tap toggles a square (and can unfill); free space not clickable.
- [ ] Counter shows filled/24; BINGO detected on manual 5-in-a-row → win screen with correct stats.

### Phase 3 — Speech recognition + auto-fill (≈25 min)

1. `src/hooks/useSpeechRecognition.ts` — Web Speech API wrapper: `continuous`, `interimResults`, `lang:'en-US'`; `start/stop/reset`; `onresult` (final vs interim), `onerror`, `onend` auto-restart; `isSupported` feature flag (Architecture hook code + gap #7).
2. In `GameBoard`: enable-mic flow with privacy copy (gap #9); on enable, `startListening`.
3. On each **final** transcript: build `alreadyFilled` set → `detectWordsWithAliases` → for each hit, resolve the square via the `wordToSquare` index (gap #11), fill it (`isAutoFilled=true`, `isNew=true` one-shot, `filledAt`), fire a Toast, announce via the `aria-live` region (gap #14), then re-run `checkForBingo`; on win, call `onWin(line, lastDetectedWord)` (gap #12).
4. `TranscriptPanel.tsx` — live status dot, last ~100 chars + interim, detected-word chips (Architecture component code).
5. Near-bingo tension: use the extended `getClosestToWin` (gap #21) to show "One away! Need: <word>" and highlight the specific missing square(s) (UXR Moment 2).
6. Unsupported-browser fallback: hide toggle, show notice, manual play intact (gap #10).

**Acceptance (PRD US-2.1, US-2.2, US-2.3):**
- [ ] Mic permission prompt with local-processing privacy message; graceful deny handling.
- [ ] Active-listening indicator; transcript renders within ~1s.
- [ ] Spoken buzzword auto-fills its square < 500ms, with toast; same word twice fills once.
- [ ] Compound phrase (e.g. "code review") detected; multiple words in one sentence all fill.
- [ ] Speech-unsupported browser still fully playable via tap.

### Phase 4 — Polish, persistence, deploy (≈15 min)

1. `WinScreen.tsx` — `canvas-confetti` burst (guarded by `prefers-reduced-motion`, gap #20), winning-line highlight with non-winning squares dimmed, stats (time-to-bingo, winning word, squares filled, category), **sound off** (UXR Moment 3); Share + Play Again.
2. `src/lib/shareUtils.ts` — build text summary + link; `navigator.share` when available else clipboard copy with a confirmation toast (PRD US-4.3).
3. `src/hooks/useLocalStorage.ts` + persist in-progress `GameState` with a `version` key; on restore, validate shape and **never set `isListening:true`** (require explicit re-enable, gap #17); clear on Play Again/Home (PRD US-1.x persistence, P1).
4. Responsive pass: card scales on mobile, square text truncates gracefully (PRD P1).
5. `vite.config.ts` (port 3000, sourcemaps) per architecture; verify `npm run build` output; deploy to Vercel.

**Acceptance (PRD US-4.1, US-4.2, US-4.3):**
- [ ] Confetti plays without lag; winning line highlighted; "BINGO!" prominent; no sound by default.
- [ ] Win summary shows time, winning word, filled count, category.
- [ ] Share copies summary + play link (works pasted into Slack/Teams/Discord); mobile triggers native share sheet.
- [ ] Reloading mid-game restores the card and fills.
- [ ] Layout works on mobile portrait + landscape; production build deploys.

---

## 7. File-by-file responsibilities (quick reference)

| File | Responsibility | Source |
|------|----------------|--------|
| `types/index.ts` | All shared interfaces/types | Arch §Core Types |
| `data/categories.ts` | 3 buzzword packs (40+ each) | Arch §Buzzword Data |
| `lib/utils.ts` | `cn()` class merge | gap #2 |
| `lib/cardGenerator.ts` | Shuffle + build 5×5 card | Arch §Card Generator |
| `lib/bingoChecker.ts` | Win lines, filled count, closest-to-win | Arch §Bingo Checker |
| `lib/wordDetector.ts` | Buzzword matching + aliases | Arch §Word Detector |
| `lib/shareUtils.ts` | Share text + clipboard/native share | PRD US-4.3 |
| `hooks/useSpeechRecognition.ts` | Web Speech API wrapper | Arch §Speech Hook |
| `hooks/useLocalStorage.ts` | Persistence helper (P1) | PRD §2.1 |
| `components/App` flow | Screen state machine | Arch §App |
| `components/LandingPage` | Hero + how-it-works | PRD §6.2 |
| `components/CategorySelect` | 3 category cards + back | PRD §6.3 |
| `components/GameBoard` | Header, card, controls, speech wiring | PRD §6.4 |
| `components/BingoCard` / `BingoSquare` | 5×5 grid + square states | Arch §BingoSquare |
| `components/TranscriptPanel` | Live transcript + detected chips | Arch §TranscriptPanel |
| `components/GameControls` | New card, listen toggle | PRD §7.1 |
| `components/WinScreen` | Confetti, winning card, stats, share | PRD §6.5 |
| `components/ui/*` | Button, Card, Toast | PRD §7.1 |

---

## 8. Data & control flow (from Architecture §Data Flow)

1. **Card generation:** select category → shuffle words → pick 24 → render 5×5 with center free space.
2. **Speech → fill:** audio → Web Speech API → final transcript → `detectWordsWithAliases` (minus already-filled) → fill square(s) + toast → `checkForBingo`.
3. **Win:** any fill triggers `checkForBingo` → on line, set `status:'won'`, `winningLine`, `winningWord`, `completedAt` → WinScreen + confetti.

---

## 9. Testing plan

> **Metrics (H4):** PRD §1.3 / UXR success metrics (share-rate, time-to-bingo, accuracy, return-rate) are **not instrumented** in the MVP and are validated manually in the workshop; analytics is deferred to the backlog (§11).
> **Cross-browser (M8):** beyond the Chrome DoD, run a quick smoke test on Safari (webkit-prefix path) and Edge; Firefox falls back to manual play.

**Manual (workshop — primary), from PRD §9 / Arch §Testing Checklist:**
- Functional: unique card, per-category variety, manual toggle, all 12 win lines, win stats, share content.
- Speech: permission prompt, listening indicator, detection from clear speech, auto-fill, compound words, graceful fallback when API absent.
- Edge cases: multiple simultaneous detections, repeated word fills once, tab switch & return, mobile landscape.

**Automated (optional, only if time):**
- Pure-logic unit tests with Vitest for `cardGenerator` (uniqueness, free space), `bingoChecker` (each of 12 lines, free-space participation), `wordDetector` (case, boundaries, phrases, aliases, already-filled skip). These functions are deterministic except the shuffle (seed or assert set membership).

---

## 10. Risks & mitigations (from PRD §10 / Arch §Risk)

| Risk | Mitigation |
|------|------------|
| Web Speech API unavailable (Firefox) | Feature-detect; hide toggle; manual play remains fully functional |
| Poor transcription accuracy | Manual tap fallback always available; `WORD_ALIASES` for common variants |
| Meeting audio not captured (core value-prop risk: Web Speech uses the **local mic only**, not system/remote-call audio — undercuts US-2.1/US-2.3 "any participant / system audio") | In-app guidance at the enable step (play meeting audio aloud / hold device near speaker); manual tap fallback always available |
| Recognition stops after silence | `onend` auto-restart while listening (gap #7) |
| Workshop time overrun | Phases ordered so each is demoable; P1/P2 (persistence, dark mode) are droppable |
| Confetti/animation jank | Use `canvas-confetti`; detect on final results only; keep DOM updates minimal |

---

## 11. Out of scope / future backlog (PRD §12, UXR vision)

Multiplayer real-time sync (WebSocket / WebRTC / Firebase — Arch §Future) · "Join Game" links & shared rooms · custom buzzword packs · leaderboards & social proof · achievements/streaks · meeting-type templates (sales, board, client) · sound effects toggle · dark mode (P2) · persistent multi-game history · PWA / mobile app · calendar integration · analytics/metrics instrumentation (H4) · pre-game card preview & regenerate-before-start (H9 / US-1.3) · screenshot/image share card (M7 / US-4.2) · user-enableable sound toggle · "Keep Playing" after win for blackout/multi-bingo · keyboard grid navigation for the 5×5 · toast container/stacking spec.

---

## 12. Definition of Done (MVP)

- [ ] Full flow works: landing → category → game → win → play again.
- [ ] Card generation, manual toggle, and all 12 BINGO lines verified.
- [ ] Speech auto-fill works in Chrome with toasts and < 500ms feel; manual fallback verified where speech is unavailable.
- [ ] Win celebration (confetti + highlight + stats), sound off by default.
- [ ] Share copies a summary + link; native share on mobile.
- [ ] In-progress game persists across reload (P1).
- [ ] Responsive on mobile portrait + landscape (P1).
- [ ] `npm run build` and `npm run typecheck` pass; deployed to Vercel.

---

*Plan derived from the Meeting Bingo PRD, Architecture Plan, and UXR (021.School Workshop).*
