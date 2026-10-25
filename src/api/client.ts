import type { FieldErrors, LeaderboardEntry, SubmissionInput, SubmitResponse } from '../shared/submission'

export type SubmitOutcome =
  | { kind: 'success'; rank: number | null }
  | { kind: 'invalid'; errors: FieldErrors }
  | { kind: 'failed'; message: string }

const NETWORK_MESSAGE = 'Couldn’t reach the server. Check the connection and try again.'
const SERVER_MESSAGE = 'Your score wasn’t saved. Please try again.'

// Safe to call again with the same input: the server deduplicates on attemptId.
export async function submitScore(input: SubmissionInput, fetchImpl: typeof fetch = fetch): Promise<SubmitOutcome> {
  let res: Response
  try {
    res = await fetchImpl('/api/submit-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  } catch {
    return { kind: 'failed', message: NETWORK_MESSAGE }
  }

  const body = (await res.json().catch(() => null)) as SubmitResponse | null

  if (res.ok && body?.status === 'recorded') return { kind: 'success', rank: body.rank }
  if (res.ok && body?.status === 'already_recorded') return { kind: 'success', rank: null }
  if (res.status === 400 && body?.status === 'invalid') return { kind: 'invalid', errors: body.errors }
  return { kind: 'failed', message: SERVER_MESSAGE }
}

export async function fetchLeaderboard(fetchImpl: typeof fetch = fetch): Promise<LeaderboardEntry[]> {
  const res = await fetchImpl('/api/leaderboard')
  if (!res.ok) throw new Error(`Leaderboard request failed: ${res.status}`)
  const body = (await res.json()) as { entries: LeaderboardEntry[] }
  return body.entries
}
