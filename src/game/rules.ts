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

// One ruby per reel keeps the jackpot a timing challenge. Each reel has its own order.
export const REEL_STRIPS: readonly (readonly SymbolId[])[] = [
  ['ruby', 'rails', 'bug', 'gear', 'test', 'deploy', 'rails', 'bug', 'gear', 'test', 'deploy', 'rails'],
  ['gear', 'ruby', 'deploy', 'bug', 'rails', 'test', 'gear', 'deploy', 'bug', 'rails', 'test', 'gear'],
  ['test', 'deploy', 'rails', 'ruby', 'bug', 'gear', 'test', 'rails', 'deploy', 'bug', 'gear', 'test'],
]

export const ROUND_MS = 45_000

// After a spin is scored, the next pull is locked briefly so the result can be read.
export const RESULT_PAUSE_MS = 500

// Time for a stopped reel to ease onto the nearest symbol.
export const SETTLE_MS = 120

export const PAYOUTS = {
  rubyTriple: 100,
  triple: 50,
  pair: 10,
  bugTriple: 0,
} as const

// Multiplier for the Nth consecutive scoring spin: x1, x2, x3, then capped at x4.
export const MAX_MULTIPLIER = 4

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
// RESULT_PAUSE_MS, so this assumes a ruby jackpot at max multiplier on every possible spin.
export const MAX_PLAUSIBLE_SCORE =
  Math.ceil(ROUND_MS / RESULT_PAUSE_MS) * PAYOUTS.rubyTriple * MAX_MULTIPLIER
