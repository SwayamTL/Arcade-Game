# RubyConf India Arcade

Booth kiosk site for RailsFactory at RubyConf India 2026.

## Current milestone
One game only: **Ruby Slots**. After a 45 s round the player can leave a name and email. The result is stored in Supabase through a Netlify Function, and a public "Today's top 10" shows names and scores. Don't add other games, routing, auth, a game registry, or a shared arcade engine until a later milestone asks for them.

## Stack
React 19 + TypeScript + Vite 8, Tailwind CSS v4 (Vite plugin, CSS-first `@theme`, no `tailwind.config.js`), Netlify Functions (v2, `Request -> Response`), Supabase Postgres, Vitest.

## Structure
- `src/game/rules.ts`: **every tunable game number** (strips, paytable, timer, speed levels, multiplier cap, `MAX_PLAUSIBLE_SCORE`). Change rules here.
- `src/game/scoring.ts`, `src/game/reels.ts`: pure logic, unit-tested.
- `src/game/useSlotGame.ts`: game state machine + rAF loop. State lives in a ref, React gets `GameView` snapshots, and reel transforms are written straight to the DOM.
- `src/components/`: `SlotMachine`, `Reel`, `ResultPanel`, `PlayerForm`, `Leaderboard`, `Header`.
- `src/content/copy.ts`: all UI text. Strings marked `REVIEW` need RailsFactory sign-off.
- `src/shared/submission.ts`: validation + API types shared by the browser and the functions.
- `src/api/client.ts`: browser calls to `/api/*`.
- `netlify/functions/`: entry points only (`submit-score`, `leaderboard`). Every file here deploys as a function, so put shared code and tests in `netlify/lib/`.
- `netlify/lib/handlers.ts` (testable handlers) and `netlify/lib/store.ts` (Supabase service-role client).
- `supabase/migrations/`: schema, version-controlled.
- `src/assets/brand/`: official SVGs copied unchanged from the design handoff. Never edit or redraw them.

## Conventions
- Brand tokens live only in `src/index.css` `@theme` (`brand-bg`, `ink`, `accent`, `accent-bright`, `surface`, `line`, `danger`). Font: DM Mono, self-hosted via `@fontsource`.
- Emails are private. `game_submissions` has RLS on with no policies, and only the service role (the functions) touches it. API responses never include emails, and the leaderboard returns `{ name, score }` only.
- Submissions are idempotent. The browser creates `attemptId` when a round ends, a retry resends the same ID, and a duplicate insert (unique violation) returns `already_recorded`.
- Never fake a successful write. Missing env vars make the functions return 500.
- The score is client-reported. The server only bounds-checks it against `MAX_PLAUSIBLE_SCORE`, so there is no real anti-cheat.

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
