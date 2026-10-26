// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTapes } from './reels'
import { REEL_MIN_SPIN_MS, STRIP_LENGTH, type SymbolId } from './rules'
import { useSlotGame } from './useSlotGame'

// Fixed tapes (a simple seeded rng), and the index of a bug or a filler on each. With the
// animation loop stubbed out the reels don't move, so every stop lands where the round started.
let seed = 7
const TAPES = createTapes(() => (seed = (seed * 9301 + 49297) % 233280) / 233280)
const find = (match: (s: SymbolId) => boolean) =>
  TAPES.map((tape) => Array.from({ length: STRIP_LENGTH }, (_, n) => n).find((n) => match(tape.at(n)))!)
const BUGS = find((s) => s === 'bug')
const NO_BUGS = find((s) => s !== 'bug' && s !== 'ruby')

let now = 1000
beforeEach(() => {
  now = 1000
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  vi.stubGlobal('requestAnimationFrame', () => 0)
  vi.stubGlobal('cancelAnimationFrame', () => {})
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function stopAll(game: { current: ReturnType<typeof useSlotGame> }) {
  for (let i = 0; i < 3; i++) act(() => void game.current.stop())
}

describe('useSlotGame', () => {
  it('only starts a round from a pull', () => {
    const { result } = renderHook(() => useSlotGame(NO_BUGS, TAPES))
    let accepted = true
    act(() => void (accepted = result.current.stop()))
    expect(accepted).toBe(false)
    expect(result.current.view.phase).toBe('ready')

    act(() => void (accepted = result.current.pull()))
    expect(accepted).toBe(true)
    expect(result.current.view.phase).toBe('spinning')
    act(() => void (accepted = result.current.pull()))
    expect(accepted).toBe(false)
  })

  it('ignores Stop until the reels have spun for a moment', () => {
    const { result } = renderHook(() => useSlotGame(NO_BUGS, TAPES))
    act(() => void result.current.pull())
    let accepted = true
    now += REEL_MIN_SPIN_MS - 1
    act(() => void (accepted = result.current.stop()))
    expect(accepted).toBe(false)
    expect(result.current.view.stoppedCount).toBe(0)

    now += 1
    act(() => void (accepted = result.current.stop()))
    expect(accepted).toBe(true)
    expect(result.current.view.stoppedCount).toBe(1)
  })

  it('never lets bug penalties take the score below zero', () => {
    const { result } = renderHook(() => useSlotGame(BUGS, TAPES))
    act(() => void result.current.pull())
    now += REEL_MIN_SPIN_MS
    stopAll(result)
    expect(result.current.view.lastSpin).toMatchObject({ outcome: 'bug' })
    expect(result.current.view.lastSpin!.points).toBeLessThan(0)
    expect(result.current.view.score).toBe(0)
  })

  it('resets mid-spin to a fresh round that a pull can start', () => {
    const { result } = renderHook(() => useSlotGame(NO_BUGS, TAPES))
    act(() => void result.current.pull())
    now += REEL_MIN_SPIN_MS
    act(() => void result.current.stop())
    act(() => result.current.reset())
    expect(result.current.view).toMatchObject({ phase: 'ready', score: 0, stoppedCount: 0, attemptId: null })

    let accepted = false
    act(() => void (accepted = result.current.pull()))
    expect(accepted).toBe(true)
    expect(result.current.view.phase).toBe('spinning')
  })
})
