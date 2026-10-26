import { BUG_PENALTY, MAX_MULTIPLIER, PAYOUTS, SPEED_LEVELS, type SymbolId } from './rules'

// 'bugged' is a losing spin with one or two bugs on the payline; 'bug' is three of them.
export type Outcome = 'jackpot' | 'triple' | 'pair' | 'bug' | 'bugged' | 'miss'

export interface SpinResult {
  outcome: Outcome
  basePoints: number
  multiplier: number
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
  if (pairSymbol && pairSymbol !== 'bug') return 'pair'
  return 'miss'
}

const BASE_POINTS: Record<Outcome, number> = {
  jackpot: PAYOUTS.rubyTriple,
  triple: PAYOUTS.triple,
  pair: PAYOUTS.pair,
  bug: PAYOUTS.bugTriple,
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
  const classified = classify(symbols)
  const bugs = symbols.filter((s) => s === 'bug').length
  const outcome: Outcome = classified === 'miss' && bugs > 0 ? 'bugged' : classified
  const basePoints = outcome === 'bugged' ? -BUG_PENALTY * bugs : BASE_POINTS[outcome]
  if (basePoints <= 0) {
    return { outcome, basePoints, multiplier: 1, points: basePoints, streak: 0 }
  }
  const multiplier = multiplierFor(streak)
  return { outcome, basePoints, multiplier, points: basePoints * multiplier, streak: streak + 1 }
}

export function speedForScore(score: number): number {
  let speed = SPEED_LEVELS[0].symbolsPerSecond
  for (const level of SPEED_LEVELS) {
    if (score >= level.minScore) speed = level.symbolsPerSecond
  }
  return speed
}
