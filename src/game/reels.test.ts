import { describe, expect, it } from 'vitest'
import { FILLERS, SHUFFLE_EVERY_ROTATIONS, STRIP_LENGTH } from './rules'
import { createTape, shuffleArrangement, snapTarget, spacedOut, symbolAt, windowCells, wrap, WINDOW_CELLS, type Rng } from './reels'

// Deterministic rng (mulberry32) so failures reproduce.
function seeded(seed: number): Rng {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SYMBOLS_CHECKED = 10_000

describe('reel positions', () => {
  it('wraps offsets', () => {
    expect(wrap(13, 12)).toBe(1)
    expect(wrap(-1, 12)).toBe(11)
  })

  it('snaps to the nearest symbol', () => {
    expect(snapTarget(4.4)).toBe(4)
    expect(snapTarget(4.6)).toBe(5)
  })

  it('reads the symbol on the payline', () => {
    const tape = createTape(seeded(1))
    expect(symbolAt(tape, 41.3)).toBe(tape.at(41))
    expect(symbolAt(tape, 41.6)).toBe(tape.at(42))
  })

  it('lists the cells for the reel window, starting one above floor(offset)', () => {
    const tape = createTape(seeded(2))
    const cells = windowCells(tape, 20.7)
    expect(cells).toHaveLength(WINDOW_CELLS)
    expect(cells).toEqual([19, 20, 21, 22, 23].map((n) => tape.at(n)))
  })
})

describe('reel tape', () => {
  const tape = createTape(seeded(3))
  const symbols = Array.from({ length: SYMBOLS_CHECKED }, (_, n) => tape.at(n))
  const blocks = Array.from({ length: SYMBOLS_CHECKED / STRIP_LENGTH }, (_, b) =>
    symbols.slice(b * STRIP_LENGTH, (b + 1) * STRIP_LENGTH),
  )

  it('puts one ruby and one bug in the first half of every rotation', () => {
    for (const block of blocks) {
      const first = block.slice(0, STRIP_LENGTH / 2)
      expect(first.filter((s) => s === 'ruby')).toHaveLength(1)
      expect(first.filter((s) => s === 'bug')).toHaveLength(1)
      expect([...block.slice(STRIP_LENGTH / 2)].sort()).toEqual([...FILLERS].sort())
    }
  })

  it('keeps an order for SHUFFLE_EVERY_ROTATIONS rotations, then reshuffles', () => {
    let changed = 0
    for (let b = 0; b < blocks.length - 1; b++) {
      const sameArrangement = (b + 1) % SHUFFLE_EVERY_ROTATIONS !== 0
      if (sameArrangement) expect(blocks[b + 1]).toEqual(blocks[b])
      else if (blocks[b + 1].join() !== blocks[b].join()) changed += 1
    }
    expect(changed).toBeGreaterThan(0)
  })

  it('never repeats a symbol close to itself, across reshuffles too', () => {
    expect(spacedOut(symbols)).toBe(true)
  })

  // Old arrangements are dropped, but a reel only ever looks a symbol or two behind itself.
  it('keeps reading the same symbols just behind the newest', () => {
    const n = SYMBOLS_CHECKED - 20
    expect([tape.at(n - 1), tape.at(n), tape.at(n + 1)]).toEqual([symbols[n - 1], symbols[n], symbols[n + 1]])
  })

  it('spaces out an arrangement against itself and the previous one', () => {
    const rng = seeded(4)
    let previous = shuffleArrangement(rng)
    for (let i = 0; i < 1000; i++) {
      const next = shuffleArrangement(rng, previous)
      expect(spacedOut([...previous, ...next, ...next])).toBe(true)
      previous = next
    }
  })
})
