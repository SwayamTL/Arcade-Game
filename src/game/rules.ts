// Every tunable number for Ruby Slots lives here. Change rules here, not in components.

export const SYMBOLS = {
  ruby: { glyph: '💎', label: 'Ruby' },
  rails: { glyph: '🚂', label: 'Rails' },
  gear: { glyph: '⚙️', label: 'Gear' },
  test: { glyph: '🧪', label: 'Test' },
  deploy: { glyph: '🚀', label: 'Deploy' },
  bug: { glyph: '🐛', label: 'Bug' },
} as const

export type SymbolId = keyof typeof SYMBOLS

export const REEL_COUNT = 3

// A reel is a run of shuffled 8-symbol arrangements (see reels.ts). The first 4 symbols hold the
// ruby, the bug (each a 1 in 8 chance) and two fillers in any order; the last 4 are the four fillers.
export const STRIP_LENGTH = 8
export const FILLERS = ['rails', 'gear', 'test', 'deploy'] as const satisfies readonly SymbolId[]

// Each reel reshuffles after this many rotations, so players can't learn the order.
export const SHUFFLE_EVERY_ROTATIONS = 2

// Two copies of a filler are at least this many symbols apart.
export const MIN_REPEAT_GAP = 3

export const ROUND_MS = 45_000

// After a spin is scored, the next pull is locked briefly so the result can be read.
export const RESULT_PAUSE_MS = 500

// Stop presses are ignored until the reels have spun this long. Without it, an instant stop
// lands on the previous symbols and a triple can be repeated on purpose.
export const REEL_MIN_SPIN_MS = 350

// Time for a stopped reel to ease onto the nearest symbol.
export const SETTLE_MS = 120

// Only rubies score. Points for 0, 1, 2 or 3 rubies on the payline, before the streak
// multiplier; every other symbol is worth 0. Each bug then costs BUG_PENALTY.
export const RUBY_POINTS = [0, 10, 30, 100] as const

// Points lost for each bug on the payline, never multiplied. Any bug also breaks the streak.
// This keeps blind mashing below a beginner who aims; a round's score never drops below 0.
export const BUG_PENALTY = 10

// Multiplier for the Nth consecutive spin with a ruby: x1, x2, then capped at x3.
export const MAX_MULTIPLIER = 3

// Reel speed in symbols per second, stepping up once the score passes each threshold.
export const SPEED_LEVELS: readonly { minScore: number; symbolsPerSecond: number }[] = [
  { minScore: 0, symbolsPerSecond: 8 },
  { minScore: 150, symbolsPerSecond: 10.5 },
  { minScore: 400, symbolsPerSecond: 13 },
  { minScore: 800, symbolsPerSecond: 15.5 },
]

// Slight per-reel variation so the reels never move in lockstep.
export const REEL_SPEED_FACTORS = [1, 1.07, 1.14] as const

// Upper bound used by the server to reject impossible scores. Every spin takes at least
// RESULT_PAUSE_MS, so this assumes three rubies at max multiplier on every possible spin.
export const MAX_PLAUSIBLE_SCORE = Math.ceil(ROUND_MS / RESULT_PAUSE_MS) * RUBY_POINTS[3] * MAX_MULTIPLIER

// A lever drag spins once the knob passes this fraction of its track. A tap always spins.
export const LEVER_PULL_FRACTION = 0.5

// Staff reset: holding the machine's title this long ends the current round or result screen
// without saving, e.g. when a player walks away. Long enough that players won't trigger it.
export const STAFF_RESET_HOLD_MS = 3000
