# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state: pre-implementation

There is **no application code yet** — only planning docs under `docs/`. The app described below has not been scaffolded. When asked to build, scaffold into this existing repo (preserve `docs/`, `README.md`, `.git`) rather than creating a new project directory.

The implementation plan is the source of truth, not the architecture doc. Where the three planning docs conflict, `docs/meeting-bingo-implementation-plan.md` §4 ("Resolved decisions & gaps") has already adjudicated them — **read §4 before writing code.** Do not reintroduce patterns from the architecture doc that §4 overrode.

## Planning docs

- `docs/meeting-bingo-prd.md` — product requirements, user stories (US-x.x referenced throughout the plan).
- `docs/meeting-bingo-architecture.md` — technical design with full reference implementations of every module/component. Treat its code as a starting draft, **superseded by the implementation plan's §4 corrections.**
- `docs/meeting-bingo-uxr.md` — UX research; "Moments" and design principles referenced by the plan.
- `docs/meeting-bingo-implementation-plan.md` — **authoritative.** Locked scope (§2), resolved decisions (§4), phased build with acceptance criteria (§6), file responsibilities (§7), Definition of Done (§12).

## What this app is

Browser-only Meeting Bingo: a 5×5 buzzword card that auto-fills as it hears meeting buzzwords via the **Web Speech API** (local mic, no backend, no API keys, $0 infra). React 18 + TypeScript + Vite + Tailwind, deployed static to Vercel.

## Stack & commands (once scaffolded)

Vite + React-TS. Planned package scripts:

```
npm run dev        # Vite dev server (port 3000)
npm run build      # tsc && vite build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint . --ext ts,tsx
npm run preview    # serve the production build
```

Deps to add at scaffold: `canvas-confetti clsx tailwind-merge` (runtime) and `tailwindcss postcss autoprefixer` (dev). Tests are optional (Vitest) for pure-logic modules only; the workshop validates manually.

## Architecture (target)

A screen state machine, no router, no global store. `App.tsx` holds `GameState` in `useState` and drives screens `landing → category → game → win` via prop drilling (Context was **dropped** for MVP — plan §4 #1). Logic lives in pure `lib/` modules called from components; speech lives in a hook.

- `lib/cardGenerator.ts` — Fisher–Yates shuffle, builds the 5×5 grid (24 words + center FREE space pre-filled). Also builds a `wordToSquare` lower-cased index for O(1) auto-fill lookup (plan §4 #11 — the architecture draft omits this).
- `lib/bingoChecker.ts` — `checkForBingo` (12 lines: 5 row, 5 col, 2 diag), `countFilled`, `getClosestToWin` (must also return the missing word/square for the "one away" UI — §4 #21).
- `lib/wordDetector.ts` — buzzword matching: word-boundary regex for single tokens, substring only for genuine multi-word phrases, skips already-filled words via an `alreadyFilled: Set`.
- `hooks/useSpeechRecognition.ts` — Web Speech API wrapper; `continuous`, `interimResults`, ref-guarded `onend` auto-restart (Chrome stops after silence).
- `data/categories.ts` — three buzzword packs (Agile, Corporate, Tech), 40+ words each.

Data flow: speech `final` transcript → `detectWordsWithAliases` (minus already-filled) → resolve square via `wordToSquare` → mark filled → `checkForBingo` → on a line, `GameBoard` calls `onWin(line, winningWord)`. The win check **derives from card state**; `winningWord` is supplied by the fill handler (the last word filled), not computed inside `checkForBingo` (§4 #12).

## Conventions baked into the plan (honor these)

- **Detection runs on final transcript fragments only**, never interim — performance budget is auto-fill visible <500ms, card render <100ms.
- **Never persist `isListening: true`** — restoring it would auto-start the mic with no user gesture. Persisted `GameState` carries a `version` field; validate shape on load and fall back to a fresh game on mismatch. `filledCount` is derived (`countFilled`), not stored.
- **Accessibility is in-scope, not optional:** square state needs a non-color cue (✓ glyph + `line-through`, `aria-pressed`, `aria-label`); auto-fills announce via an `aria-live="polite"` region; "BINGO!" is `aria-live="assertive"`.
- **Reduced motion:** gate confetti / pulse / bounce-in behind `prefers-reduced-motion`; auto-fill pulse is one-shot (a transient `isNew` flag cleared after ~500ms), not the permanent `animate-pulse` keyed on `isAutoFilled`.
- **Privacy copy is a feature:** the mic-enable step must state audio is processed locally and never recorded/sent. Gate listening behind an explicit enable action.
- **Filled-square color is `bg-blue-500`** (architecture wins over the PRD token — §4 #18).
- Feature-detect speech; on unsupported browsers (Firefox) hide the listen toggle and keep the game fully playable by manual tap.

## Known core-value-prop risk

Web Speech API captures the **local microphone only**, not system/remote-call audio. This undercuts the "hear any participant" promise. The mitigation is in-app guidance (play meeting audio aloud / hold device near speaker) plus the always-available manual tap — do not silently assume system-audio capture works.
