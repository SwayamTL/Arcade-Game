import { useState } from 'react'
import railsFactorySymbolGreen from './assets/brand/railsfactory-symbol-green.svg'
import { Header } from './components/Header'
import { Leaderboard } from './components/Leaderboard'
import { ResultPanel } from './components/ResultPanel'
import { SlotMachine } from './components/SlotMachine'
import { ABOUT, EVENT, GAME } from './content/copy'
import { randomOffsets, useSlotGame } from './game/useSlotGame'

export default function App() {
  const [initialOffsets] = useState(randomOffsets)
  const { view, act, reset, setStripEl } = useSlotGame(initialOffsets)
  const [leaderboardVersion, setLeaderboardVersion] = useState(0)

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-8">
        <Header />

        <div className="flex">
          <div className="flex items-center gap-4 rounded-2xl border-2 border-accent bg-surface px-5 py-4" aria-current="true">
            <span className="text-3xl" aria-hidden="true">
              🎰
            </span>
            <div>
              <p className="font-medium">{GAME.name}</p>
              <p className="text-sm text-ink/70">{GAME.short}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <SlotMachine
            view={view}
            initialOffsets={initialOffsets}
            act={act}
            setStripEl={setStripEl}
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

          <aside className="flex flex-col gap-6">
            <Leaderboard refreshKey={leaderboardVersion} />
            <section className="rounded-3xl border-2 border-ink bg-surface p-5 text-sm leading-relaxed sm:p-6">
              <p>
                <span className="font-medium">{ABOUT.heading}</span> {ABOUT.body}
              </p>
            </section>
          </aside>
        </div>
      </main>

      <footer className="bg-ink px-4 py-6 text-sm text-white/80 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <img src={railsFactorySymbolGreen} alt="" width={150} height={128} className="h-10 w-auto rounded bg-brand-bg" />
          <p>RailsFactory at {EVENT.name}</p>
        </div>
      </footer>
    </div>
  )
}
