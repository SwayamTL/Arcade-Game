# RubyConf India Arcade

Booth kiosk site for RailsFactory at RubyConf India 2026. There is one game, **Ruby Slots**. A player has 45 seconds to score, then can leave a name and email. Today's top 10 (names and scores only) is shown beside the machine.

This README explains how the pieces fit together. Commands, environment variables and project rules are in [CLAUDE.md](CLAUDE.md).

## How it works

### Playing a round
1. **Pull the lever** (`Lever.tsx`, drag or tap, or ↓ on a keyboard). `useSlotGame.pull()` starts the 45 s timer and spins the reels.
2. **Hit Stop** (the Stop button, Space or Enter). `useSlotGame.stop()` stops the next reel, left to right. Presses in the first 350 ms of a spin are ignored.
3. **Scoring: add up the line.** After the third reel, `scoring.ts` scores the payline as *match points × streak multiplier − 10 per 🐛*. A pair is 10, a triple 50, and 💎 pays double (20 / 100). A match grows the streak (×2, ×3, then ×4 at most), and any 🐛 or a miss resets it. So 🚂🚂🐛 with no streak nets 0, and 🐛🐛🐛 is −30. The round score never drops below 0. The status line shows the sum, e.g. `Pair +20 (×2) · 🐛 −10 = +10 Streak lost.`
4. **The next spin needs the lever again.** Using the wrong control shakes the right one (`feedback.ts`) and shows a hint. It never costs points.
5. **The round ends.** When the timer runs out, `useSlotGame` creates an `attemptId` and `SlotMachine` shows `ResultPanel` over the reels.

`useSlotGame` keeps the game state in a ref and runs a `requestAnimationFrame` loop that writes reel transforms straight to the DOM. React only gets `GameView` snapshots, so it doesn't re-render every frame.

### Saving a score
`PlayerForm` → `validateSubmission` (instant browser check) → `api/client.submitScore` → `POST /api/submit-score` → `netlify/lib/handlers.handleSubmit` (validates again) → `netlify/lib/store` → the Supabase table `game_submissions`. The reply includes today's rank, and `App` refreshes `Leaderboard`.

A retry resends the same `attemptId`. A duplicate insert returns `already_recorded`, so a score is never saved twice.

### Showing the leaderboard
`Leaderboard` → `api/client.fetchLeaderboard` → `GET /api/leaderboard` → `handleLeaderboard` → the SQL function `daily_top_scores`. It returns each player's best score today (grouped by email, with the day in IST). Emails never leave the server.

### Fullscreen
The header icon or the 🎰 tile calls `useFullscreen.toggle()`, which requests fullscreen on the app root. The UI switches to the compact layout only when the browser confirms (`fullscreenchange`). If the browser refuses, it shows a fallback note.

## File map
Each entry says what the file does, what it affects, and when you'd change it.

### `src/` (browser app)
| File | What it does | Change it to… |
|---|---|---|
| `main.tsx` | Mounts `App` and loads `index.css`. | (rarely) |
| `App.tsx` | Page layout: header, 🎰 tile, machine, leaderboard, footer. Owns fullscreen state and switches to the compact fullscreen layout. Joins the game hook to `SlotMachine` and `ResultPanel`. | Change the page layout or what shows in fullscreen. |
| `index.css` | Tailwind import, brand colour/font tokens (`@theme`), base styles. | Change brand colours or fonts. |

### `src/game/` (Ruby Slots rules and engine, no UI)
| File | What it does | Change it to… |
|---|---|---|
| `rules.ts` | **Every tunable number**: reel strips, symbols, round length, payouts (pair, triple, ruby factor), bug penalty, multiplier cap, speed levels, minimum spin time, lever pull threshold, and `MAX_PLAUSIBLE_SCORE` (used by the server). | Rebalance the game. Start here. |
| `scoring.ts` | Pure functions: name the payline (for the status text), add up its points and streak, pick reel speed for a score. | Change *how* spins are scored (not just the numbers). |
| `reels.ts` | Reel position helpers: wrapping, snapping to the nearest symbol, the cells to render. | Change how reels land or render. |
| `useSlotGame.ts` | The game state machine (`ready → spinning → scored → … → over`), the timer, the animation loop, `pull`/`stop`/`reset`. | Change round flow, timing or what counts as valid input. |

### `src/components/` (UI)
| File | What it does | Change it to… |
|---|---|---|
| `SlotMachine.tsx` | The machine: score/timer header, reels, lever, status line, Stop button. Holds the keyboard shortcuts and wrong-control hints. Sizes the reels for fullscreen. | Change the machine's look or controls. |
| `Reel.tsx` | One reel window. Its strip is moved by the game loop, not by React. | Change reel visuals. |
| `Lever.tsx` | The draggable lever. Travel is measured from the rendered track. States: `ready` (can be pulled), `busy` (pressing it is a wrong move), `off`. | Change the lever's feel or pull threshold behaviour. |
| `feedback.ts` | `nudge` (shake, or an outline pulse with reduced motion) and `buzz` (vibration, Android only). | Change wrong-input or haptic feedback. |
| `ResultPanel.tsx` | End-of-round overlay: final score, RailsFactory pitch, then the form or "Saved, you're #N". | Change the end-of-round screen. |
| `PlayerForm.tsx` | Name, email, consent and opt-in. Validates in the browser, submits, handles retry and skip. | Change form fields or behaviour. |
| `Leaderboard.tsx` | Today's top 10, refreshed after each saved score. | Change how the board looks. |
| `Header.tsx` | Site header with the RailsFactory and RubyConf logos. | Change header content. |
| `FullscreenButton.tsx` | The fullscreen icon button with its fallback note, plus the shared `FullscreenIcon`. | Change the fullscreen control's look. |
| `useFullscreen.ts` | Fullscreen state from the real browser API, plus `releasePointerFocus` (stops a clicked button keeping Space/Enter). | Change fullscreen behaviour or error handling. |

### Other `src/` folders
| File | What it does | Change it to… |
|---|---|---|
| `content/copy.ts` | **All visible text.** Strings marked `REVIEW` need RailsFactory sign-off. | Change any wording. |
| `shared/submission.ts` | The submission contract used by both the browser and the server: types, `validateSubmission`, `GAME_ID`, name/email limits. | Change what a submission contains or how it's validated. |
| `api/client.ts` | Browser calls to `/api/submit-score` and `/api/leaderboard`, mapped to simple outcomes. | Change API calls or error messages. |
| `assets/brand/` | Official logos from the design handoff. **Never edit them.** | (replace only with new official files) |

### `netlify/` (server)
| File | What it does | Change it to… |
|---|---|---|
| `functions/submit-score.ts`, `functions/leaderboard.ts` | Entry points only. Each one connects a URL to a handler. Every file in `functions/` is deployed, so don't put anything else there. | Add or rename an endpoint. |
| `lib/handlers.ts` | Request handling: method checks, validation, responses. It's testable because the store is passed in. | Change API behaviour or responses. |
| `lib/store.ts` | Supabase access using the service-role key. Server only. | Change queries or the table mapping. |

### `supabase/migrations/`
The schema in SQL: the `game_submissions` table (row-level security on, no policies, so only the service role can touch it), plus the `daily_top_scores` and `daily_rank` functions. To change the schema, add a **new** migration file. Never edit one that has already been applied.

### Tests
Tests sit next to the file they test (`Lever.tsx` → `Lever.test.tsx`), with one exception: `netlify/lib/handlers.test.ts`, because `functions/` can't hold tests. Logic tests run in Node. Component and hook tests start with `// @vitest-environment jsdom`. Run them with `npm test`.

## How do I…
- **Rebalance the game** (payouts, timer, speed, bug penalty): edit `src/game/rules.ts`. `MAX_PLAUSIBLE_SCORE` is calculated from the round length, the result pause, three rubies (`PAYOUTS.triple × RUBY_FACTOR`) and the multiplier cap. If you add a way to score more per spin than three rubies, update that formula, or the server will reject real scores. Update the how-to text in `copy.ts` if a rule players can see has changed.
- **Change any text**: `src/content/copy.ts`.
- **Change colours or fonts**: the tokens in `src/index.css` `@theme` only.
- **Change the lever feel**: `LEVER_PULL_FRACTION` in `rules.ts`, the snap-back and tap animation in `Lever.tsx`.
- **Change the fullscreen layout**: the `fill` branches in `App.tsx` and `SlotMachine.tsx`. Check 1024×768 and 768×1024 afterwards.
- **Change what's stored**: add a migration, then update `shared/submission.ts`, `lib/store.ts` and `PlayerForm.tsx`.

## Adding a second game (later milestone)
Not built yet on purpose (see CLAUDE.md). When it's needed, this is everything that's tied to Slots:
- **Database:** `game_id` already exists, but its check only allows `'ruby-slots'`. Widen it in a new migration. The leaderboard functions already filter by game.
- **`shared/submission.ts`:** `GAME_ID` is a single constant and the score cap comes from the Slots `MAX_PLAUSIBLE_SCORE`. Both need to depend on the game.
- **`netlify/lib/handlers.ts`:** uses that single `GAME_ID`. It would read the game from the request.
- **Slots-only code with general names:** `src/game/` and the components `SlotMachine`, `Reel`, `Lever` and `feedback`. Move them into `src/games/slots/`.
- **`App.tsx`:** places Slots directly. The 🎰 tile becomes one tile per game.

Already shared, and works for any game: `Header`, `Leaderboard`, `PlayerForm`, `ResultPanel`, the fullscreen pieces, `api/client` and the Netlify functions.
