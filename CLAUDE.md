# RubyConf India Arcade

Booth kiosk site for RailsFactory at RubyConf India 2026.

## Current milestone
One game only: **Ruby Slots**. After a 45 s round the player can leave a name and email. The result is stored in Supabase through a Netlify Function, and a public "Today's top 10" shows names and scores. Don't add other games, routing, auth, a game registry, or a shared arcade engine until a later milestone asks for them.

## Stack
React 19 + TypeScript + Vite 8, Tailwind CSS v4 (Vite plugin, CSS-first `@theme`, no `tailwind.config.js`), Netlify Functions (v2, `Request -> Response`), Supabase Postgres, Vitest.

## Structure
`README.md` has the full file map (what each file does, what it affects, when to change it) and the data flows. This list is the short version.
- `src/game/rules.ts`: **every tunable game number** (reel layout and reshuffle interval, ruby paytable `RUBY_POINTS`, bug penalty, timer, speed levels, multiplier cap, minimum spin time, lever pull threshold, staff reset hold time, `MAX_PLAUSIBLE_SCORE`). Change rules here.
- `src/game/scoring.ts`, `src/game/reels.ts` (shuffled reel tapes): pure logic, unit-tested.
- `src/game/useSlotGame.ts`: game state machine + rAF loop. State lives in a ref, React gets `GameView` snapshots, and reel transforms are written straight to the DOM.
- `src/components/`: `SlotMachine` (machine UI, keyboard shortcuts, wrong-control hints), `StaffReset` (hold the machine title to reset), `Reel`, `Lever` (pointer-drag lever), `feedback.ts` (shake/vibrate helpers), `ResultPanel`, `PlayerForm`, `Leaderboard`, `Header`, `FullscreenButton` + `useFullscreen` (Fullscreen API).
- `src/content/copy.ts`: all UI text. Strings marked `REVIEW` need RailsFactory sign-off.
- `src/shared/submission.ts`: validation + API types shared by the browser and the functions.
- `src/api/client.ts`: browser calls to `/api/*`.
- `netlify/functions/`: entry points only (`submit-score`, `leaderboard`). Every file here deploys as a function, so put shared code and tests in `netlify/lib/`.
- `netlify/lib/handlers.ts` (testable handlers) and `netlify/lib/store.ts` (Supabase service-role client).
- `supabase/migrations/`: schema, version-controlled.
- `src/assets/brand/`: official SVGs copied unchanged from the design handoff. Never edit or redraw them.
- Tests sit next to the file they test (`Foo.tsx` → `Foo.test.tsx`). Component and hook tests start with `// @vitest-environment jsdom`.

## Game behaviour
- **Controls are split on purpose.** Only the lever (drag, tap, or ↓) starts a spin. The Stop button, Space and Enter only stop reels. Using the wrong control shakes the right one (`nudge`) and never costs points. Don't merge them back into one input, because that brings back blind mashing.
- Stop presses in the first `REEL_MIN_SPIN_MS` of a spin are ignored, which closes an exploit that repeated triples.
- **Only rubies score** (the game's goal is "stop on three rubies"; RailsFactory asked for this). Scoring adds up the line: `rubyPoints × multiplier − bugs × BUG_PENALTY`, with 1 / 2 / 3 rubies worth 10 / 30 / 100 and every other symbol 0. Bugs are flat (never multiplied), so 💎🚂🐛 with no streak is 0 and 🐛🐛🐛 is −30. A spin with a ruby grows the streak (×2, then ×3 cap), and a spin with no ruby or any bug breaks it. Keep it a plain sum. Players reason by adding what they see, so no special cases (an earlier version where a pair with a bug paid full points, and 🐛🐛🐛 was −100, read as unfair). The status line (`SpinBreakdown` in `SlotMachine`) shows the sum. A round's score never drops below 0 (the server rejects negatives).
- Each reel rotation is 8 symbols: ruby, bug and two fillers in any order (the bug may sit next to the ruby, on purpose, for challenge), then the four fillers. So ruby and bug are 1 in 8 each. Each reel reshuffles every `SHUFFLE_EVERY_ROTATIONS` rotations, even mid-spin, so the order can't be memorised. A reel is an append-only tape (`reels.ts`), so a symbol never changes while it's on screen. No symbol repeats within `MIN_REPEAT_GAP` places.
- Balance was checked with a Monte Carlo simulation of a spammer, a beginner, a casual and a skilled player. The target order is spammer < beginner < casual < skilled, with about 6% or fewer beginners scoring 0. Paying a single ruby (10) is what keeps beginners off 0; without it about 8% of beginners and 70% of spammers score 0. Re-check that order before changing payouts, penalties, strips, speeds or the timer.
- **No skip on the result screen.** Collecting emails is the booth's goal, so the only way to the next player is submitting the form (then "Next player"). Don't add a skip back without marketing's say-so.
- **Staff reset is hidden.** Holding the machine title for `STAFF_RESET_HOLD_MS` resets from any phase (mid-spin or the result screen) without saving. Keep it free of any visible hint, so players don't use it as a skip.
- Fullscreen targets the `App` root. The layout switches only on a real `fullscreenchange`, and the click is never trusted. A pointer click on any `[data-native-keys]` control must release focus (`releasePointerFocus`) so Space and Enter keep stopping reels.

## Conventions
- Brand tokens live only in `src/index.css` `@theme` (`brand-bg`, `ink`, `accent`, `accent-bright`, `surface`, `line`, `danger`). Font: DM Mono, self-hosted via `@fontsource`.
- Emails are private. `game_submissions` has RLS on with no policies, and only the service role (the functions) touches it. API responses never include emails, and the leaderboard returns `{ name, score }` only.
- Submissions are idempotent. The browser creates `attemptId` when a round ends, a retry resends the same ID, and a duplicate insert (unique violation) returns `already_recorded`.
- Never fake a successful write. Missing env vars make the functions return 500.
- The score is client-reported. The server only bounds-checks it against `MAX_PLAUSIBLE_SCORE`, so there is no real anti-cheat.

## Keeping docs current
Docs are part of every change, in the same commit:
- Adding, removing, renaming or moving a file: update the README file map, the Structure list above, and any flow it appears in.
- Changing behaviour, a rule or a data flow: update the README section that describes it, plus "Game behaviour" or "Conventions" here if a rule changed.
- New source files start with a 1–2 line comment saying what the file does and what it affects. When you edit a file that lacks one, add it. Keep these comments true when the file changes.
- Game numbers go in `rules.ts`, visible text in `copy.ts`, colours in `index.css` `@theme`. Never hard-code them in components.
- Before finishing a change, check that every path named in README.md and CLAUDE.md still exists.

## Environment variables (server-only, set in Netlify and in local `.env`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Never prefix these with `VITE_`, because that would bundle them into the browser.

## Commands
- `npm run dev:netlify`: app + functions at http://localhost:8888 (reads `.env`)
- `npm run dev`: Vite only. `/api/*` calls fail.
- `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`
- Apply the schema: `npx supabase link --project-ref <ref>` then `npx supabase db push`, or paste the migration into the Supabase SQL editor.

## Pending review (REVIEW in copy.ts)
- Consent text and the privacy policy link (none yet).
- Marketing opt-in wording.
- Data removal/retention note.
