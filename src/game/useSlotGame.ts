import { useCallback, useEffect, useRef, useState } from 'react'
import { REEL_COUNT, REEL_MIN_SPIN_MS, REEL_SPEED_FACTORS, RESULT_PAUSE_MS, ROUND_MS, SETTLE_MS, STRIP_LENGTH, SYMBOLS } from './rules'
import { evaluateSpin, speedForScore, type SpinResult } from './scoring'
import { createTapes, snapTarget, symbolAt, windowCells, WINDOW_CELLS, type Tape } from './reels'

// Game state lives in a ref so the animation loop can read and write it every frame.
// React only sees `GameView` snapshots, published on game events and timer ticks.

export type Phase = 'ready' | 'spinning' | 'scored' | 'over'

interface ReelMotion {
  offset: number
  stopped: boolean
  settleFrom: number
  settleTo: number
  settleStart: number
}

interface GameState {
  phase: Phase
  score: number
  streak: number
  stoppedCount: number
  spins: number
  jackpots: number
  lastSpin: SpinResult | null
  deadline: number
  unlockAt: number
  spinStartedAt: number
  attemptId: string | null
}

export interface GameView {
  phase: Phase
  score: number
  streak: number
  stoppedCount: number
  spins: number
  jackpots: number
  lastSpin: SpinResult | null
  timeLeftMs: number
  locked: boolean
  // Created once when a round ends; identifies this attempt for idempotent submission.
  attemptId: string | null
}

function newGame(): GameState {
  return {
    phase: 'ready',
    score: 0,
    streak: 0,
    stoppedCount: 0,
    spins: 0,
    jackpots: 0,
    lastSpin: null,
    deadline: 0,
    unlockAt: 0,
    spinStartedAt: 0,
    attemptId: null,
  }
}

function snapshot(g: GameState, now: number): GameView {
  const timeLeftMs = g.phase === 'ready' ? ROUND_MS : g.phase === 'over' ? 0 : Math.max(0, g.deadline - now)
  return {
    phase: g.phase,
    score: g.score,
    streak: g.streak,
    stoppedCount: g.stoppedCount,
    spins: g.spins,
    jackpots: g.jackpots,
    lastSpin: g.lastSpin,
    timeLeftMs,
    locked: g.phase === 'scored' && now < g.unlockAt,
    attemptId: g.attemptId,
  }
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function randomOffsets(): number[] {
  return Array.from({ length: REEL_COUNT }, () => Math.floor(Math.random() * STRIP_LENGTH))
}

// Draws a reel at an offset: rewrites its WINDOW_CELLS glyphs when the reel reaches a new symbol,
// then shifts them by the fraction in between. translateY % is relative to the strip's own height.
export function paintReel(el: HTMLElement, tape: Tape, offset: number) {
  const base = Math.floor(offset)
  if (el.dataset.base !== String(base)) {
    el.dataset.base = String(base)
    windowCells(tape, offset).forEach((symbol, i) => {
      const cell = el.children[i]
      if (cell) cell.textContent = SYMBOLS[symbol].glyph
    })
  }
  el.style.transform = `translate3d(0, ${(-(offset - base) / WINDOW_CELLS) * 100}%, 0)`
}

// `tapes` is injectable so tests can control which symbols land.
export function useSlotGame(initialOffsets: readonly number[], tapes?: readonly Tape[]) {
  const [reelTapes] = useState(() => tapes ?? createTapes())
  const game = useRef<GameState>(newGame())
  const reels = useRef<ReelMotion[]>(
    initialOffsets.map((offset) => ({ offset, stopped: true, settleFrom: offset, settleTo: offset, settleStart: 0 })),
  )
  const stripEls = useRef<(HTMLDivElement | null)[]>([])
  const [view, setView] = useState<GameView>(() => snapshot(newGame(), 0))

  const publish = useCallback(() => setView(snapshot(game.current, performance.now())), [])

  const stopNextReel = useCallback((now: number) => {
    const g = game.current
    const reel = reels.current[g.stoppedCount]
    reel.stopped = true
    reel.settleFrom = reel.offset
    reel.settleTo = snapTarget(reel.offset)
    reel.settleStart = prefersReducedMotion() ? now - SETTLE_MS : now
    g.stoppedCount += 1

    if (g.stoppedCount === REEL_COUNT) {
      const landed = reels.current.map((r, i) => symbolAt(reelTapes[i], r.settleTo))
      const result = evaluateSpin([landed[0], landed[1], landed[2]], g.streak)
      // Bug penalties can't take a round below zero.
      g.score = Math.max(0, g.score + result.points)
      g.streak = result.streak
      g.lastSpin = result
      g.spins += 1
      if (result.outcome === 'jackpot') g.jackpots += 1
      g.phase = 'scored'
      g.unlockAt = now + RESULT_PAUSE_MS
    }
  }, [reelTapes])

  const finish = useCallback(
    (now: number) => {
      const g = game.current
      while (g.phase === 'spinning') stopNextReel(now)
      // The animation loop ends here, so land every reel on its symbol immediately.
      reels.current.forEach((reel, i) => {
        reel.offset = reel.settleTo
        const el = stripEls.current[i]
        if (el) paintReel(el, reelTapes[i], reel.offset)
      })
      g.phase = 'over'
      g.attemptId = crypto.randomUUID()
      publish()
    },
    [publish, stopNextReel, reelTapes],
  )

  // The lever starts every spin; Stop only stops reels. Each returns whether the input counted,
  // so the UI can point the player at the right control.
  const pull = useCallback((): boolean => {
    const g = game.current
    const now = performance.now()
    if (g.phase === 'ready') {
      g.deadline = now + ROUND_MS
    } else if (g.phase !== 'scored' || now < g.unlockAt) {
      return false
    }
    g.phase = 'spinning'
    g.stoppedCount = 0
    g.spinStartedAt = now
    reels.current = reels.current.map((reel) => ({ ...reel, stopped: false }))
    publish()
    return true
  }, [publish])

  const stop = useCallback((): boolean => {
    const g = game.current
    const now = performance.now()
    if (g.phase !== 'spinning' || now - g.spinStartedAt < REEL_MIN_SPIN_MS) return false
    stopNextReel(now)
    publish()
    return true
  }, [publish, stopNextReel])

  // Back to a fresh round from any phase. A reset mid-spin lands the reels on their nearest symbol.
  const reset = useCallback(() => {
    reels.current = reels.current.map((reel, i) => {
      const offset = reel.stopped ? reel.settleTo : snapTarget(reel.offset)
      const el = stripEls.current[i]
      if (el) paintReel(el, reelTapes[i], offset)
      return { offset, stopped: true, settleFrom: offset, settleTo: offset, settleStart: 0 }
    })
    game.current = newGame()
    publish()
  }, [publish, reelTapes])

  const running = view.phase === 'spinning' || view.phase === 'scored'

  useEffect(() => {
    if (!running) return
    let frame = 0
    let last = performance.now()
    let lastTick = -1
    let wasLocked = game.current.phase === 'scored' && last < game.current.unlockAt

    const loop = (now: number) => {
      const g = game.current
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now

      if (now >= g.deadline) {
        finish(now)
        return
      }

      const speed = speedForScore(g.score)
      reels.current.forEach((reel, i) => {
        if (!reel.stopped) {
          reel.offset += speed * REEL_SPEED_FACTORS[i] * dt
        } else if (reel.offset !== reel.settleTo) {
          const t = Math.min(1, (now - reel.settleStart) / SETTLE_MS)
          const eased = 1 - (1 - t) * (1 - t)
          reel.offset = t === 1 ? reel.settleTo : reel.settleFrom + (reel.settleTo - reel.settleFrom) * eased
        }
        const el = stripEls.current[i]
        if (el) paintReel(el, reelTapes[i], reel.offset)
      })

      // Re-render on each tenth of a second, and when the pull lock lifts.
      const tick = Math.floor((g.deadline - now) / 100)
      const locked = g.phase === 'scored' && now < g.unlockAt
      if (tick !== lastTick || locked !== wasLocked) {
        lastTick = tick
        wasLocked = locked
        publish()
      }
      frame = requestAnimationFrame(loop)
    }

    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [running, finish, publish, reelTapes])

  // Paints as soon as a reel mounts, so the first frame already shows symbols.
  const setStripEl = useCallback(
    (index: number, el: HTMLDivElement | null) => {
      stripEls.current[index] = el
      if (el) paintReel(el, reelTapes[index], reels.current[index].offset)
    },
    [reelTapes],
  )

  return { view, pull, stop, reset, setStripEl }
}
