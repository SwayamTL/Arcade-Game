// Reel symbols and positions. Each reel is an endless tape of shuffled arrangements, so the order
// changes as it turns; the game loop and the landing check both read symbols from here.
import { FILLERS, MIN_REPEAT_GAP, REEL_COUNT, SHUFFLE_EVERY_ROTATIONS, STRIP_LENGTH, type SymbolId } from './rules'

// A reel's position is a continuous offset measured in symbols. Offset n (an integer)
// puts tape symbol n exactly on the payline. Offsets only grow while the reels spin.

export type Rng = () => number

export interface Tape {
  at(n: number): SymbolId
}

export function wrap(offset: number, length: number): number {
  return ((offset % length) + length) % length
}

// Where a reel comes to rest when the player presses STOP: the nearest symbol.
export function snapTarget(offset: number): number {
  return Math.round(offset)
}

export function symbolAt(tape: Tape, offset: number): SymbolId {
  return tape.at(snapTarget(offset))
}

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// True when no symbol repeats within MIN_REPEAT_GAP places.
export function spacedOut(symbols: readonly SymbolId[]): boolean {
  return symbols.every((s, i) => !symbols.slice(i + 1, i + MIN_REPEAT_GAP).includes(s))
}

// One arrangement: ruby, bug and two fillers in any order, then the four fillers. It repeats for
// SHUFFLE_EVERY_ROTATIONS, so it must be spaced out against itself and against the previous one.
export function shuffleArrangement(rng: Rng, previous?: readonly SymbolId[]): SymbolId[] {
  const tail = previous?.slice(-(MIN_REPEAT_GAP - 1)) ?? []
  let fallback: SymbolId[] | null = null
  for (let tries = 0; tries < 100; tries++) {
    const extras = shuffle(FILLERS, rng).slice(0, 2)
    const arrangement = [...shuffle<SymbolId>(['ruby', 'bug', ...extras], rng), ...shuffle(FILLERS, rng)]
    if (!spacedOut([...arrangement, ...arrangement])) continue
    if (spacedOut([...tail, ...arrangement])) return arrangement
    fallback ??= arrangement
  }
  // Practically unreachable: give up on spacing across the join only.
  return fallback ?? [...shuffle<SymbolId>(['ruby', 'bug', ...FILLERS.slice(0, 2)], rng), ...FILLERS]
}

// Arrangements are made on demand, in order, and old ones are dropped so a kiosk can run all day.
export function createTape(rng: Rng = Math.random): Tape {
  const arrangements = new Map<number, SymbolId[]>()
  let newest = -2
  const arrangementFor = (k: number) => {
    while (newest < k) {
      newest += 1
      arrangements.set(newest, shuffleArrangement(rng, arrangements.get(newest - 1)))
      arrangements.delete(newest - 4)
    }
    return arrangements.get(k) ?? arrangements.get(newest)!
  }
  return {
    at(n) {
      const k = Math.floor(Math.floor(n / STRIP_LENGTH) / SHUFFLE_EVERY_ROTATIONS)
      return arrangementFor(k)[wrap(n, STRIP_LENGTH)]
    },
  }
}

export function createTapes(rng: Rng = Math.random): Tape[] {
  return Array.from({ length: REEL_COUNT }, () => createTape(rng))
}

// Cells rendered per reel. The 3-row window shows the symbol above the payline, the payline and
// the one below; the extra cells cover a reel caught between symbols.
export const WINDOW_CELLS = 5

// The symbols for those cells, starting one above the symbol at floor(offset).
export function windowCells(tape: Tape, offset: number): SymbolId[] {
  const base = Math.floor(offset)
  return Array.from({ length: WINDOW_CELLS }, (_, i) => tape.at(base - 1 + i))
}
