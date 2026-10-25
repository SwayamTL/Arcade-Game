import { describe, expect, it } from 'vitest'
import { REEL_STRIPS } from './rules'
import { renderCells, snapTarget, symbolAt, wrap } from './reels'

const strip = REEL_STRIPS[0]

describe('reels', () => {
  it('wraps offsets into the strip', () => {
    expect(wrap(13, 12)).toBe(1)
    expect(wrap(-1, 12)).toBe(11)
  })

  it('snaps to the nearest symbol', () => {
    expect(snapTarget(4.4)).toBe(4)
    expect(snapTarget(4.6)).toBe(5)
  })

  it('reads the symbol on the payline after many loops', () => {
    expect(symbolAt(strip, 0)).toBe(strip[0])
    expect(symbolAt(strip, strip.length * 7 + 2.3)).toBe(strip[2])
    expect(symbolAt(strip, strip.length - 0.4)).toBe(strip[0])
  })

  it('renders enough cells for a 3-row window at any offset', () => {
    const cells = renderCells(strip)
    expect(cells).toHaveLength(strip.length + 3)
    expect(cells[0]).toBe(strip[strip.length - 1])
    expect(cells[1]).toBe(strip[0])
  })

  it('has exactly one ruby per reel', () => {
    for (const s of REEL_STRIPS) expect(s.filter((x) => x === 'ruby')).toHaveLength(1)
  })
})
