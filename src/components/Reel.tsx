// One reel window on the machine. Its cells are filled and moved by the game loop (`paintReel`
// in useSlotGame), not by React, because the reel's symbol order changes as it turns.
import { WINDOW_CELLS } from '../game/reels'

interface ReelProps {
  index: number
  stopped: boolean
  setStripEl: (index: number, el: HTMLDivElement | null) => void
}

export function Reel({ index, stopped, setStripEl }: ReelProps) {
  return (
    <div
      className={`relative h-[calc(var(--cell)*3)] flex-1 overflow-hidden rounded-xl border-2 bg-surface transition-colors ${
        stopped ? 'border-accent' : 'border-line'
      }`}
      aria-hidden="true"
    >
      <div ref={(el) => setStripEl(index, el)} className="will-change-transform">
        {Array.from({ length: WINDOW_CELLS }, (_, i) => (
          <div
            key={i}
            className="flex h-[var(--cell)] items-center justify-center text-[calc(var(--cell)*0.55)] leading-none select-none"
          />
        ))}
      </div>
      {/* Fade the rows above and below the payline. */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-surface)_0%,transparent_36%,transparent_64%,var(--color-surface)_100%)] opacity-80" />
    </div>
  )
}
