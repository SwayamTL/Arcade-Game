import { MAX_MULTIPLIER, PAYOUTS, SPEED_LEVELS, type SymbolId } from './rules'

export type Outcome = 'jackpot' | 'triple' | 'pair' | 'bug' | 'miss'

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
  const basePoints = BASE_POINTS[outcome]
  if (basePoints === 0) {
    return { outcome, basePoints, multiplier: 1, points: 0, streak: 0 }
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
