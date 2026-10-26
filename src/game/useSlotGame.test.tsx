// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { REEL_MIN_SPIN_MS } from './rules'
import { useSlotGame } from './useSlotGame'

// Strip indexes of a bug on each reel. With the animation loop stubbed out the reels don't
// move, so every stop lands exactly where the round started.
const BUGS = [2, 3, 4]
const NO_BUGS = [1, 0, 2]

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
    const { result } = renderHook(() => useSlotGame(NO_BUGS))
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
    const { result } = renderHook(() => useSlotGame(NO_BUGS))
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
    const { result } = renderHook(() => useSlotGame(BUGS))
    act(() => void result.current.pull())
    now += REEL_MIN_SPIN_MS
    stopAll(result)
    expect(result.current.view.lastSpin).toMatchObject({ outcome: 'bug' })
    expect(result.current.view.lastSpin!.points).toBeLessThan(0)
    expect(result.current.view.score).toBe(0)
  })

  it('resets mid-spin to a fresh round that a pull can start', () => {
    const { result } = renderHook(() => useSlotGame(NO_BUGS))
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
