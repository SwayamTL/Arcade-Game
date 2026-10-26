// Pure scoring for Ruby Slots: names a payline, adds up its points and streak, and picks reel
// speed for a score. Only rubies score; the numbers come from rules.ts.
import { BUG_PENALTY, MAX_MULTIPLIER, RUBY_POINTS, SPEED_LEVELS, type SymbolId } from './rules'

// Names the line for the status text. 'bug' is three bugs; 'bugged' is no ruby but at least one bug.
export type Outcome = 'jackpot' | 'rubyPair' | 'ruby' | 'bug' | 'bugged' | 'miss'

// A spin adds up its line: rubyPoints × multiplier − bugs × BUG_PENALTY.
export interface SpinResult {
  outcome: Outcome
  // What the rubies are worth before the multiplier; 0 when there are none.
  matchPoints: number
  multiplier: number
  bugs: number
  points: number
  // Consecutive spins with a ruby after this one; 0 means the streak was broken.
  streak: number
}

const count = (line: readonly SymbolId[], symbol: SymbolId) => line.filter((s) => s === symbol).length

export function classify(line: readonly [SymbolId, SymbolId, SymbolId]): Outcome {
  const rubies = count(line, 'ruby')
  if (rubies === 3) return 'jackpot'
  if (rubies === 2) return 'rubyPair'
  if (rubies === 1) return 'ruby'
  const bugs = count(line, 'bug')
  if (bugs === 3) return 'bug'
  return bugs > 0 ? 'bugged' : 'miss'
}

export function multiplierFor(streak: number): number {
  return Math.min(1 + streak, MAX_MULTIPLIER)
}

export function evaluateSpin(
  symbols: readonly [SymbolId, SymbolId, SymbolId],
  streak: number,
): SpinResult {
  const matchPoints = RUBY_POINTS[count(symbols, 'ruby')]
  const bugs = count(symbols, 'bug')
  const multiplier = matchPoints > 0 ? multiplierFor(streak) : 1
  return {
    outcome: classify(symbols),
    matchPoints,
    multiplier,
    bugs,
    points: matchPoints * multiplier - bugs * BUG_PENALTY,
    // A ruby grows the streak; any bug breaks it.
    streak: matchPoints > 0 && bugs === 0 ? streak + 1 : 0,
  }
}

export function speedForScore(score: number): number {
  let speed = SPEED_LEVELS[0].symbolsPerSecond
  for (const level of SPEED_LEVELS) {
    if (score >= level.minScore) speed = level.symbolsPerSecond
  }
  return speed
}
