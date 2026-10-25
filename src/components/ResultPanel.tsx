import { useState } from 'react'
import { RESULT } from '../content/copy'
import { PlayerForm } from './PlayerForm'

interface ResultPanelProps {
  score: number
  spins: number
  jackpots: number
  attemptId: string
  onSubmitted: () => void
  onNextPlayer: () => void
}

type Saved = { rank: number | null } | null

export function ResultPanel({ score, spins, jackpots, attemptId, onSubmitted, onNextPlayer }: ResultPanelProps) {
  const [saved, setSaved] = useState<Saved>(null)

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <div className="text-center">
        <p className="text-lg">You scored</p>
        <p className="font-mono text-7xl font-medium tabular-nums">{score}</p>
        <p className="mt-1 text-sm text-ink/70">
          {spins} {spins === 1 ? 'spin' : 'spins'} · {jackpots} ruby {jackpots === 1 ? 'jackpot' : 'jackpots'}
        </p>
      </div>

      <p className="rounded-xl border-l-4 border-accent bg-surface p-4 text-sm leading-relaxed">{RESULT.pitch}</p>

      {saved ? (
        <div className="flex flex-col items-center gap-4 text-center" role="status">
          <p className="text-lg font-medium">
            {saved.rank ? `Saved. You’re #${saved.rank} on today’s board.` : 'Saved. Check today’s board.'}
          </p>
          <button
            type="button"
            onClick={onNextPlayer}
            autoFocus
            className="rounded-xl border-2 border-ink bg-ink px-8 py-3 font-medium text-white"
          >
            Next player
          </button>
        </div>
      ) : (
        <PlayerForm
          score={score}
          attemptId={attemptId}
          onSubmitted={(rank) => {
            setSaved({ rank })
            onSubmitted()
          }}
          onSkip={onNextPlayer}
        />
      )}
    </div>
  )
}
