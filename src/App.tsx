import { useRef, useState } from 'react'
import railsFactorySymbolGreen from './assets/brand/railsfactory-symbol-green.svg'
import { FullscreenButton, FullscreenIcon } from './components/FullscreenButton'
import { Header } from './components/Header'
import { Leaderboard } from './components/Leaderboard'
import { ResultPanel } from './components/ResultPanel'
import { SlotMachine } from './components/SlotMachine'
import { releasePointerFocus, useFullscreen } from './components/useFullscreen'
import { ABOUT, EVENT, FULLSCREEN, GAME } from './content/copy'
import { randomOffsets, useSlotGame } from './game/useSlotGame'

export default function App() {
  const [initialOffsets] = useState(randomOffsets)
  const { view, pull, stop, reset, setStripEl } = useSlotGame(initialOffsets)
  const [leaderboardVersion, setLeaderboardVersion] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const fullscreen = useFullscreen(rootRef)
  // Fullscreen shows just the machine and the board, sized to the screen.
  const fill = fullscreen.isFullscreen

  return (
    <div ref={rootRef} className={`flex flex-col bg-brand-bg ${fill ? 'h-dvh overflow-hidden' : 'min-h-dvh'}`}>
      <main
        className={`mx-auto flex w-full flex-1 flex-col ${fill ? 'min-h-0 p-3 sm:p-4' : 'max-w-7xl gap-8 px-4 py-8 sm:px-8'}`}
      >
        {!fill && <Header />}

        <div className={fill ? 'hidden' : 'flex'}>
          <button
            type="button"
            onClick={(e) => {
              releasePointerFocus(e)
              fullscreen.toggle()
            }}
            data-native-keys
            aria-current="true"
            className="flex items-center gap-4 rounded-2xl border-2 border-accent bg-surface px-5 py-4 text-left transition hover:bg-brand-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px"
          >
            <span className="text-3xl" aria-hidden="true">
              🎰
            </span>
            <span className="flex flex-col">
              <span className="font-medium">{GAME.name}</span>
              <span className="text-sm text-ink/70">{GAME.short}</span>
              <span className="mt-1 flex items-center gap-1.5 text-xs font-medium text-accent">
                <FullscreenIcon className="size-3.5" />
                {FULLSCREEN.tileHint}
              </span>
            </span>
          </button>
        </div>

        <div
          className={
            fill
              ? 'grid min-h-0 flex-1 gap-4 landscape:grid-cols-[minmax(0,1fr)_20rem] portrait:grid-rows-[minmax(0,1fr)_auto]'
              : 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]'
          }
        >
          <SlotMachine
            view={view}
            initialOffsets={initialOffsets}
            pull={pull}
            stop={stop}
            setStripEl={setStripEl}
            fill={fill}
            fullscreenControl={
              <FullscreenButton
                isFullscreen={fullscreen.isFullscreen}
                message={fullscreen.message}
                onToggle={fullscreen.toggle}
              />
            }
            resultPanel={
              view.attemptId && (
                <ResultPanel
                  key={view.attemptId}
                  score={view.score}
                  spins={view.spins}
                  jackpots={view.jackpots}
                  attemptId={view.attemptId}
                  onSubmitted={() => setLeaderboardVersion((v) => v + 1)}
                  onNextPlayer={reset}
                />
              )
            }
          />

          <aside className={fill ? 'min-h-0 overflow-y-auto portrait:max-h-[30dvh]' : 'flex flex-col gap-6'}>
            <Leaderboard refreshKey={leaderboardVersion} />
            <section hidden={fill} className="rounded-3xl border-2 border-ink bg-surface p-5 text-sm leading-relaxed sm:p-6">
              <p>
                <span className="font-medium">{ABOUT.heading}</span> {ABOUT.body}
              </p>
            </section>
          </aside>
        </div>
      </main>

      <footer hidden={fill} className="bg-ink px-4 py-6 text-sm text-white/80 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <img src={railsFactorySymbolGreen} alt="" width={150} height={128} className="h-10 w-auto rounded bg-brand-bg" />
          <p>RailsFactory at {EVENT.name}</p>
        </div>
      </footer>
    </div>
  )
}
