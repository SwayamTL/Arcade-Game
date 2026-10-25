import type { SymbolId } from './rules'

// A reel's position is a continuous offset measured in symbols. Offset n (an integer)
// puts strip[n mod length] exactly on the payline.

export function wrap(offset: number, length: number): number {
  return ((offset % length) + length) % length
}

// Where a reel comes to rest when the player presses STOP: the nearest symbol.
export function snapTarget(offset: number): number {
  return Math.round(offset)
}

export function symbolAt(strip: readonly SymbolId[], offset: number): SymbolId {
  return strip[wrap(snapTarget(offset), strip.length)]
}

// Cells to render so a 3-row window can show any offset without gaps:
// the last symbol (row above index 0), the strip, then the strip again up to two extra.
export function renderCells(strip: readonly SymbolId[]): SymbolId[] {
  return [strip[strip.length - 1], ...strip, strip[0], strip[1]]
}
