import { useEffect, useState } from 'react'
import { fetchLeaderboard } from '../api/client'
import { GAME } from '../content/copy'
import type { LeaderboardEntry } from '../shared/submission'

type Board = { entries: LeaderboardEntry[] } | { error: true }

// Shows names and scores only. The API never returns emails.
export function Leaderboard({ refreshKey }: { refreshKey: number }) {
  const [board, setBoard] = useState<Board | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchLeaderboard()
      .then((entries) => !cancelled && setBoard({ entries }))
      .catch(() => !cancelled && setBoard({ error: true }))
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  return (
    <section className="rounded-3xl border-2 border-ink bg-surface p-5 sm:p-6" aria-labelledby="leaderboard-heading">
      <h2 id="leaderboard-heading" className="text-xl font-medium">
        Today’s top 10
      </h2>
      <p className="text-sm text-ink/70">{GAME.name}</p>

      <div className="mt-4">
        {!board ? (
          <p className="text-sm text-ink/60">Loading…</p>
        ) : 'error' in board ? (
          <p className="text-sm text-ink/60">Leaderboard unavailable right now.</p>
        ) : board.entries.length === 0 ? (
          <p className="text-sm">No scores yet. First game sets the bar.</p>
        ) : (
          <ol className="flex flex-col gap-1 font-mono tabular-nums">
            {board.entries.map((entry, i) => (
              <li key={i} className="flex items-baseline gap-3 rounded-lg px-2 py-1 odd:bg-brand-bg">
                <span className="w-6 text-right text-ink/60">{i + 1}</span>
                <span className="flex-1 truncate">{entry.name}</span>
                <span className="font-medium">{entry.score}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
