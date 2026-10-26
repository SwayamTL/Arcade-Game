import { useEffect, useRef, useState, type ReactNode } from 'react'
import { GAME, NUDGE, OUTCOME_COPY } from '../content/copy'
import { REEL_STRIPS, ROUND_MS } from '../game/rules'
import type { GameView } from '../game/useSlotGame'
import { multiplierFor } from '../game/scoring'
import { buzz, nudge } from './feedback'
import { Lever, type LeverState } from './Lever'
import { Reel } from './Reel'

interface SlotMachineProps {
  view: GameView
  initialOffsets: readonly number[]
  // Each returns whether the input counted.
  pull: () => boolean
  stop: () => boolean
  setStripEl: (index: number, el: HTMLDivElement | null) => void
  // Rendered over the machine once the round is over.
  resultPanel: ReactNode
  fullscreenControl: ReactNode
  // Fullscreen: fill the available height and size the reels from the viewport.
  fill: boolean
}

const NUDGE_MS = 1800

function leverState(view: GameView): LeverState {
  if (view.phase === 'spinning') return 'busy'
  if (view.phase === 'over' || view.locked) return 'off'
  return 'ready'
}

export function SlotMachine({
  view,
  initialOffsets,
  pull,
  stop,
  setStripEl,
  resultPanel,
  fullscreenControl,
  fill,
}: SlotMachineProps) {
  const playing = view.phase === 'spinning' || view.phase === 'scored'
  const secondsLeft = Math.ceil(view.timeLeftMs / 1000)
  const timeFraction = view.timeLeftMs / ROUND_MS
  const spinning = view.phase === 'spinning'
  const leverRef = useRef<HTMLButtonElement>(null)
  const stopRef = useRef<HTMLButtonElement>(null)
  // A wrong-control hint, shown only during the phase it was raised in.
  const [hint, setHint] = useState<{ text: string; phase: GameView['phase'] } | null>(null)

  useEffect(() => {
    if (!hint) return
    const timer = setTimeout(() => setHint(null), NUDGE_MS)
    return () => clearTimeout(timer)
  }, [hint])

  // The lever starts spins and Stop stops reels. Using the wrong one shakes the right one;
  // it never costs points.
  const onPull = () => {
    if (pull()) buzz(15)
  }
  const onWrongPull = () => {
    nudge(stopRef.current)
    setHint({ text: NUDGE.stop, phase: view.phase })
  }
  const onStop = () => {
    // A Stop pressed in the first moments of a spin is ignored without fuss.
    if (stop() || spinning || view.phase === 'over') return
    nudge(leverRef.current)
    setHint({ text: NUDGE.pull, phase: view.phase })
  }

  const handlers = useRef({ onPull, onStop, onWrongPull, spinning })
  useEffect(() => {
    handlers.current = { onPull, onStop, onWrongPull, spinning }
  })

  useEffect(() => {
    if (view.phase === 'over') return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.code !== 'Enter' && e.code !== 'ArrowDown') return
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, select, a, [data-native-keys]')) return
      e.preventDefault()
      if (e.repeat) return
      const h = handlers.current
      if (e.code !== 'ArrowDown') h.onStop()
      else if (h.spinning) h.onWrongPull()
      else h.onPull()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view.phase])

  return (
    <section
      className={`overflow-hidden rounded-3xl border-2 border-ink bg-accent ${fill ? 'flex h-full min-h-0 flex-col' : ''}`}
      aria-label={GAME.name}
    >
      <header className="flex items-center justify-between gap-4 px-5 pt-4 pb-3 text-white sm:px-7">
        <h2 className="text-xl font-medium sm:text-2xl">{GAME.name}</h2>
        <div className="flex items-center gap-3 sm:gap-5">
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
          {fullscreenControl}
        </div>
      </header>
      <div className="mx-5 mb-4 h-2 overflow-hidden rounded-full bg-white/30 sm:mx-7" aria-hidden="true">
        <div
          className={`h-full rounded-full ${timeFraction < 0.2 ? 'bg-ink' : 'bg-white'}`}
          style={{ width: `${timeFraction * 100}%` }}
        />
      </div>

      <div
        className={`relative m-2 rounded-2xl bg-brand-bg px-4 py-6 sm:m-3 sm:px-8 sm:py-8 ${
          fill ? 'flex min-h-0 flex-1 flex-col justify-center' : view.phase === 'over' ? 'min-h-[44rem]' : ''
        }`}
      >
        {/* --cell sizes both the reels and the lever track, so they always match. */}
        <div
          className={`mx-auto flex w-full items-center gap-4 ${
            fill
              ? 'max-w-[calc(var(--cell)*5)] [--cell:clamp(4.5rem,calc((100dvh-30rem)/3),9rem)] portrait:[--cell:clamp(4.5rem,calc((70dvh-30rem)/3),9rem)]'
              : 'max-w-xl [--cell:4.5rem] sm:[--cell:6rem]'
          }`}
        >
          <div className="relative flex flex-1 gap-2 rounded-2xl border-2 border-ink bg-ink p-2 sm:gap-3 sm:p-3">
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

          <Lever state={leverState(view)} onPull={onPull} onWrong={onWrongPull} buttonRef={leverRef} />
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="min-h-7 text-center font-mono text-lg" aria-live="polite">
            {hint?.phase === view.phase ? (
              <span className="font-medium text-accent">{hint.text}</span>
            ) : (
              <>
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
                    {view.lastSpin.points < 0 && <span className="text-danger"> −{-view.lastSpin.points}</span>}
                  </>
                )}
                {view.phase === 'spinning' && view.streak > 0 && (
                  <span>Streak: next win ×{multiplierFor(view.streak)}</span>
                )}
              </>
            )}
          </p>

          <button
            ref={stopRef}
            type="button"
            onClick={onStop}
            // Stays pressable while idle so a wrong press can point at the lever.
            disabled={view.phase === 'over'}
            aria-disabled={!spinning}
            className={`min-w-64 rounded-2xl border-2 border-ink bg-ink px-8 py-4 text-xl font-medium text-white shadow-[0_6px_0_0_var(--color-accent)] transition active:translate-y-1 active:shadow-[0_2px_0_0_var(--color-accent)] disabled:opacity-50 ${
              spinning ? '' : 'opacity-50'
            }`}
          >
            {spinning ? `Stop reel ${view.stoppedCount + 1}` : GAME.stop}
          </button>
          <p className="text-sm text-ink/60 pointer-coarse:hidden">{GAME.keyHint}</p>
        </div>

        {view.phase === 'over' && (
          <div className="absolute inset-0 overflow-y-auto rounded-2xl bg-brand-bg/95 p-4 sm:p-8">{resultPanel}</div>
        )}
      </div>
    </section>
  )
}
