import { useEffect, type ReactNode } from 'react'
import { GAME, OUTCOME_COPY } from '../content/copy'
import { REEL_STRIPS, ROUND_MS } from '../game/rules'
import type { GameView } from '../game/useSlotGame'
import { multiplierFor } from '../game/scoring'
import { Reel } from './Reel'

interface SlotMachineProps {
  view: GameView
  initialOffsets: readonly number[]
  act: () => void
  setStripEl: (index: number, el: HTMLDivElement | null) => void
  // Rendered over the machine once the round is over.
  resultPanel: ReactNode
}

function actionLabel(view: GameView): string {
  if (view.phase === 'ready') return 'Pull to start'
  if (view.phase === 'spinning') return `Stop reel ${view.stoppedCount + 1}`
  return 'Pull'
}

export function SlotMachine({ view, initialOffsets, act, setStripEl, resultPanel }: SlotMachineProps) {
  const playing = view.phase === 'spinning' || view.phase === 'scored'
  const secondsLeft = Math.ceil(view.timeLeftMs / 1000)
  const timeFraction = view.timeLeftMs / ROUND_MS

  useEffect(() => {
    if (view.phase === 'over') return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.code !== 'Enter') return
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, select, a')) return
      e.preventDefault()
      if (!e.repeat) act()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [act, view.phase])

  return (
    <section className="overflow-hidden rounded-3xl border-2 border-ink bg-accent" aria-label={GAME.name}>
      <header className="flex items-center justify-between gap-4 px-5 pt-4 pb-3 text-white sm:px-7">
        <h2 className="text-xl font-medium sm:text-2xl">{GAME.name}</h2>
        <dl className="flex items-baseline gap-5 font-mono tabular-nums">
          <div className="flex items-baseline gap-2">
            <dt className="text-sm">Score</dt>
            <dd className="text-2xl font-medium">{view.score}</dd>
          </div>
          <div className="flex items-baseline gap-1">
            <dt className="sr-only">Time left</dt>
            <dd className="text-2xl font-medium">{secondsLeft}s</dd>
          </div>
        </dl>
      </header>
      <div className="mx-5 mb-4 h-2 overflow-hidden rounded-full bg-white/30 sm:mx-7" aria-hidden="true">
        <div
          className={`h-full rounded-full ${timeFraction < 0.2 ? 'bg-ink' : 'bg-white'}`}
          style={{ width: `${timeFraction * 100}%` }}
        />
      </div>

      <div
        className={`relative m-2 rounded-2xl bg-brand-bg px-4 py-6 sm:m-3 sm:px-8 sm:py-8 ${view.phase === 'over' ? 'min-h-[44rem]' : ''}`}
      >
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="relative flex flex-1 gap-2 rounded-2xl border-2 border-ink bg-ink p-2 [--cell:4.5rem] sm:gap-3 sm:p-3 sm:[--cell:6rem]">
            {REEL_STRIPS.map((strip, i) => (
              <Reel
                key={i}
                index={i}
                strip={strip}
                initialOffset={initialOffsets[i]}
                stopped={view.phase === 'spinning' ? i < view.stoppedCount : true}
                setStripEl={setStripEl}
              />
            ))}
            {/* Payline */}
            <div className="pointer-events-none absolute inset-x-1 top-1/2 h-0.5 -translate-y-1/2 bg-accent-bright/70" />
          </div>

          <button
            type="button"
            onClick={act}
            disabled={view.phase === 'over' || view.locked || view.phase === 'spinning'}
            className="group hidden h-[calc(var(--cell)*3)] w-10 flex-col items-center [--cell:6rem] sm:flex"
            aria-label="Pull the lever"
          >
            <span className="size-9 rounded-full border-2 border-ink bg-accent-bright transition-transform group-enabled:group-active:translate-y-24" />
            <span className="w-2 flex-1 rounded-b bg-ink" />
          </button>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="min-h-7 text-center font-mono text-lg" aria-live="polite">
            {view.phase === 'ready' && GAME.howTo}
            {playing && view.lastSpin && view.phase === 'scored' && (
              <>
                <span className="font-medium">{OUTCOME_COPY[view.lastSpin.outcome]}</span>
                {view.lastSpin.points > 0 && (
                  <span className="text-accent">
                    {' '}
                    +{view.lastSpin.points}
                    {view.lastSpin.multiplier > 1 && ` (×${view.lastSpin.multiplier})`}
                  </span>
                )}
              </>
            )}
            {view.phase === 'spinning' && view.streak > 0 && (
              <span>Streak: next win ×{multiplierFor(view.streak)}</span>
            )}
          </p>

          <button
            type="button"
            onClick={act}
            disabled={view.phase === 'over' || view.locked}
            className="min-w-64 rounded-2xl border-2 border-ink bg-ink px-8 py-4 text-xl font-medium text-white shadow-[0_6px_0_0_var(--color-accent)] transition active:translate-y-1 active:shadow-[0_2px_0_0_var(--color-accent)] disabled:opacity-50"
          >
            {actionLabel(view)}
          </button>
          <p className="text-sm text-ink/60">{GAME.keyHint}</p>
        </div>

        {view.phase === 'over' && (
          <div className="absolute inset-0 overflow-y-auto rounded-2xl bg-brand-bg/95 p-4 sm:p-8">{resultPanel}</div>
        )}
      </div>
    </section>
  )
}
