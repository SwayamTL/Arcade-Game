import { SYMBOLS, type SymbolId } from '../game/rules'
import { renderCells } from '../game/reels'
import { stripTransform } from '../game/useSlotGame'

interface ReelProps {
  index: number
  strip: readonly SymbolId[]
  initialOffset: number
  stopped: boolean
  setStripEl: (index: number, el: HTMLDivElement | null) => void
}

// The strip's transform is driven directly by the game loop, not by React renders.
export function Reel({ index, strip, initialOffset, stopped, setStripEl }: ReelProps) {
  return (
    <div
      className={`relative h-[calc(var(--cell)*3)] flex-1 overflow-hidden rounded-xl border-2 bg-surface transition-colors ${
        stopped ? 'border-accent' : 'border-line'
      }`}
      aria-hidden="true"
    >
      <div
        ref={(el) => setStripEl(index, el)}
        className="will-change-transform"
        style={{ transform: stripTransform(initialOffset, strip.length) }}
      >
        {renderCells(strip).map((symbol, i) => (
          <div
            key={i}
            className="flex h-[var(--cell)] items-center justify-center text-[calc(var(--cell)*0.55)] leading-none select-none"
          >
            {SYMBOLS[symbol].glyph}
          </div>
        ))}
      </div>
      {/* Fade the rows above and below the payline. */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-surface)_0%,transparent_36%,transparent_64%,var(--color-surface)_100%)] opacity-80" />
    </div>
  )
}
