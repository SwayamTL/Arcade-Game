import { describe, expect, it } from 'vitest'
import { BUG_PENALTY, MAX_MULTIPLIER, PAYOUTS, RUBY_FACTOR, SPEED_LEVELS } from './rules'
import { classify, evaluateSpin, multiplierFor, speedForScore } from './scoring'

describe('classify', () => {
  it('detects a ruby jackpot', () => {
    expect(classify(['ruby', 'ruby', 'ruby'])).toBe('jackpot')
  })
  it('detects other triples', () => {
    expect(classify(['rails', 'rails', 'rails'])).toBe('triple')
  })
  it('treats a bug triple as its own outcome', () => {
    expect(classify(['bug', 'bug', 'bug'])).toBe('bug')
  })
  it('detects pairs in any position', () => {
    expect(classify(['gear', 'gear', 'test'])).toBe('pair')
    expect(classify(['gear', 'test', 'gear'])).toBe('pair')
    expect(classify(['test', 'gear', 'gear'])).toBe('pair')
  })
  it('names a ruby pair', () => {
    expect(classify(['ruby', 'rails', 'ruby'])).toBe('rubyPair')
  })
  it('does not count a bug pair as a match', () => {
    expect(classify(['bug', 'bug', 'ruby'])).toBe('bugged')
  })
  it('scores nothing for three different symbols', () => {
    expect(classify(['ruby', 'rails', 'gear'])).toBe('miss')
  })
})

describe('evaluateSpin (adds up the line)', () => {
  it('pays the table at x1 with no streak', () => {
    expect(evaluateSpin(['deploy', 'deploy', 'gear'], 0)).toMatchObject({ points: PAYOUTS.pair, multiplier: 1, streak: 1 })
    expect(evaluateSpin(['deploy', 'deploy', 'deploy'], 0)).toMatchObject({ points: PAYOUTS.triple, streak: 1 })
  })

  it('pays double for rubies', () => {
    expect(evaluateSpin(['ruby', 'gear', 'ruby'], 0)).toMatchObject({ outcome: 'rubyPair', points: PAYOUTS.pair * RUBY_FACTOR })
    expect(evaluateSpin(['ruby', 'ruby', 'ruby'], 0)).toMatchObject({ outcome: 'jackpot', points: PAYOUTS.triple * RUBY_FACTOR })
  })

  it('multiplies consecutive matches and caps the multiplier', () => {
    expect(evaluateSpin(['gear', 'gear', 'test'], 1)).toMatchObject({ multiplier: 2, points: PAYOUTS.pair * 2, streak: 2 })
    expect(evaluateSpin(['gear', 'gear', 'test'], 2).multiplier).toBe(3)
    expect(evaluateSpin(['gear', 'gear', 'test'], 3).multiplier).toBe(MAX_MULTIPLIER)
    expect(evaluateSpin(['gear', 'gear', 'test'], 10).multiplier).toBe(MAX_MULTIPLIER)
  })

  it('resets the streak on a miss', () => {
    expect(evaluateSpin(['ruby', 'rails', 'gear'], 3)).toMatchObject({ points: 0, streak: 0, multiplier: 1 })
  })

  it('costs a flat amount per bug, three bugs included', () => {
    expect(evaluateSpin(['bug', 'rails', 'gear'], 2)).toMatchObject({ outcome: 'bugged', points: -BUG_PENALTY, streak: 0 })
    expect(evaluateSpin(['bug', 'bug', 'ruby'], 0)).toMatchObject({ outcome: 'bugged', points: -2 * BUG_PENALTY })
    expect(evaluateSpin(['bug', 'bug', 'bug'], 3)).toMatchObject({ outcome: 'bug', points: -3 * BUG_PENALTY, streak: 0 })
  })

  it('subtracts a bug from a match and breaks the streak', () => {
    expect(evaluateSpin(['rails', 'rails', 'bug'], 0)).toMatchObject({ outcome: 'pair', points: 0, bugs: 1, streak: 0 })
    // The multiplier applies to the match only: 10 x3 - 10.
    expect(evaluateSpin(['rails', 'bug', 'rails'], 2)).toMatchObject({ multiplier: 3, points: PAYOUTS.pair * 3 - BUG_PENALTY, streak: 0 })
  })
})

describe('multiplierFor', () => {
  it('starts at x1', () => {
    expect(multiplierFor(0)).toBe(1)
  })
})

describe('speedForScore', () => {
  it('uses the level for the highest threshold reached', () => {
    expect(speedForScore(0)).toBe(SPEED_LEVELS[0].symbolsPerSecond)
    expect(speedForScore(SPEED_LEVELS[1].minScore - 1)).toBe(SPEED_LEVELS[0].symbolsPerSecond)
    expect(speedForScore(SPEED_LEVELS[1].minScore)).toBe(SPEED_LEVELS[1].symbolsPerSecond)
    expect(speedForScore(100_000)).toBe(SPEED_LEVELS[SPEED_LEVELS.length - 1].symbolsPerSecond)
  })
  it('gets faster at every level', () => {
    for (let i = 1; i < SPEED_LEVELS.length; i++) {
      expect(SPEED_LEVELS[i].symbolsPerSecond).toBeGreaterThan(SPEED_LEVELS[i - 1].symbolsPerSecond)
    }
  })
})
