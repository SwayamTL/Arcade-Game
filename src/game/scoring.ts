import { BUG_PENALTY, MAX_MULTIPLIER, PAYOUTS, RUBY_FACTOR, SPEED_LEVELS, type SymbolId } from './rules'

// Names the line for the status text. 'bug' is three bugs; 'bugged' is no match but at least one bug.
export type Outcome = 'jackpot' | 'triple' | 'rubyPair' | 'pair' | 'bug' | 'bugged' | 'miss'

// A spin adds up its line: matchPoints × multiplier − bugs × BUG_PENALTY.
export interface SpinResult {
  outcome: Outcome
  // What the match is worth before the multiplier; 0 when nothing matched.
  matchPoints: number
  multiplier: number
  bugs: number
  points: number
  // Consecutive scoring spins after this one; 0 means the streak was broken.
  streak: number
}

export function classify([a, b, c]: readonly [SymbolId, SymbolId, SymbolId]): Outcome {
  if (a === b && b === c) {
    if (a === 'ruby') return 'jackpot'
    if (a === 'bug') return 'bug'
    return 'triple'
  }
  const pairSymbol = a === b || a === c ? a : b === c ? b : null
  if (pairSymbol === 'ruby') return 'rubyPair'
  if (pairSymbol && pairSymbol !== 'bug') return 'pair'
  return [a, b, c].includes('bug') ? 'bugged' : 'miss'
}

const MATCH_POINTS: Record<Outcome, number> = {
  jackpot: PAYOUTS.triple * RUBY_FACTOR,
  triple: PAYOUTS.triple,
  rubyPair: PAYOUTS.pair * RUBY_FACTOR,
  pair: PAYOUTS.pair,
  bug: 0,
  bugged: 0,
  miss: 0,
}

export function multiplierFor(streak: number): number {
  return Math.min(1 + streak, MAX_MULTIPLIER)
}

export function evaluateSpin(
  symbols: readonly [SymbolId, SymbolId, SymbolId],
  streak: number,
): SpinResult {
  const outcome = classify(symbols)
  const matchPoints = MATCH_POINTS[outcome]
  const bugs = symbols.filter((s) => s === 'bug').length
  const multiplier = matchPoints > 0 ? multiplierFor(streak) : 1
  return {
    outcome,
    matchPoints,
    multiplier,
    bugs,
    points: matchPoints * multiplier - bugs * BUG_PENALTY,
    // A match grows the streak; any bug breaks it.
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
