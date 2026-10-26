import { describe, expect, it } from 'vitest'
import { BUG_PENALTY, MAX_MULTIPLIER, RUBY_POINTS, SPEED_LEVELS } from './rules'
import { classify, evaluateSpin, multiplierFor, speedForScore } from './scoring'

describe('classify', () => {
  it('names the line by its rubies, in any position', () => {
    expect(classify(['ruby', 'ruby', 'ruby'])).toBe('jackpot')
    expect(classify(['ruby', 'rails', 'ruby'])).toBe('rubyPair')
    expect(classify(['gear', 'ruby', 'bug'])).toBe('ruby')
  })
  it('treats a bug triple as its own outcome', () => {
    expect(classify(['bug', 'bug', 'bug'])).toBe('bug')
  })
  it('does not count other matches', () => {
    expect(classify(['rails', 'rails', 'rails'])).toBe('miss')
    expect(classify(['gear', 'gear', 'bug'])).toBe('bugged')
  })
})

describe('evaluateSpin (adds up the line)', () => {
  it('pays only for rubies, at x1 with no streak', () => {
    expect(evaluateSpin(['ruby', 'gear', 'test'], 0)).toMatchObject({ points: RUBY_POINTS[1], multiplier: 1, streak: 1 })
    expect(evaluateSpin(['ruby', 'gear', 'ruby'], 0)).toMatchObject({ outcome: 'rubyPair', points: RUBY_POINTS[2] })
    expect(evaluateSpin(['ruby', 'ruby', 'ruby'], 0)).toMatchObject({ outcome: 'jackpot', points: RUBY_POINTS[3] })
  })

  it('pays nothing for other matches and resets the streak', () => {
    expect(evaluateSpin(['deploy', 'deploy', 'deploy'], 2)).toMatchObject({ points: 0, streak: 0, multiplier: 1 })
    expect(evaluateSpin(['gear', 'rails', 'test'], 2)).toMatchObject({ outcome: 'miss', points: 0, streak: 0 })
  })

  it('multiplies back-to-back ruby spins and caps the multiplier', () => {
    expect(evaluateSpin(['ruby', 'gear', 'test'], 1)).toMatchObject({ multiplier: 2, points: RUBY_POINTS[1] * 2, streak: 2 })
    expect(evaluateSpin(['ruby', 'gear', 'test'], 2).multiplier).toBe(MAX_MULTIPLIER)
    expect(evaluateSpin(['ruby', 'gear', 'test'], 10).multiplier).toBe(MAX_MULTIPLIER)
  })

  it('costs a flat amount per bug, three bugs included', () => {
    expect(evaluateSpin(['bug', 'rails', 'gear'], 2)).toMatchObject({ outcome: 'bugged', points: -BUG_PENALTY, streak: 0 })
    expect(evaluateSpin(['bug', 'bug', 'gear'], 0)).toMatchObject({ outcome: 'bugged', points: -2 * BUG_PENALTY })
    expect(evaluateSpin(['bug', 'bug', 'bug'], 2)).toMatchObject({ outcome: 'bug', points: -3 * BUG_PENALTY, streak: 0 })
  })

  it('subtracts a bug from rubies and breaks the streak', () => {
    expect(evaluateSpin(['ruby', 'rails', 'bug'], 0)).toMatchObject({ outcome: 'ruby', points: 0, bugs: 1, streak: 0 })
    // The multiplier applies to the rubies only: 30 x3 - 10.
    expect(evaluateSpin(['ruby', 'bug', 'ruby'], 2)).toMatchObject({ multiplier: 3, points: RUBY_POINTS[2] * 3 - BUG_PENALTY, streak: 0 })
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
