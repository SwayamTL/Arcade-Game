import { GAME_ID, validateSubmission, type SubmitResponse } from '../../src/shared/submission'
import { StoreNotConfiguredError, type SubmissionStore } from './store'

const LEADERBOARD_SIZE = 10

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  })
}

function reply(body: SubmitResponse, status: number): Response {
  return json(body, status)
}

function serverError(err: unknown): Response {
  // Log the cause server-side; the client only gets a generic message.
  console.error(err)
  const message =
    err instanceof StoreNotConfiguredError ? 'Score storage is not configured.' : 'Could not save your score.'
  return reply({ status: 'error', message }, 500)
}

export async function handleSubmit(req: Request, store: SubmissionStore): Promise<Response> {
  if (req.method !== 'POST') return json({ status: 'error', message: 'Method not allowed' }, 405, { Allow: 'POST' })

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return reply({ status: 'invalid', errors: {} }, 400)
  }

  const result = validateSubmission(payload)
  if (!result.ok) return reply({ status: 'invalid', errors: result.errors }, 400)

  const submission = result.value
  let inserted: boolean
  try {
    inserted = await store.insert(submission)
  } catch (err) {
    return serverError(err)
  }
  if (!inserted) return reply({ status: 'already_recorded' }, 200)

  // The row is saved; a failed rank lookup shouldn't turn that into an error.
  let rank: number | null = null
  try {
    rank = await store.rankFor(GAME_ID, submission.score)
  } catch (err) {
    console.error(err)
  }
  return reply({ status: 'recorded', rank }, 201)
}

export async function handleLeaderboard(req: Request, store: SubmissionStore): Promise<Response> {
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405, { Allow: 'GET' })
  try {
    const entries = await store.topScores(GAME_ID, LEADERBOARD_SIZE)
    return json({ entries }, 200, { 'Cache-Control': 'public, max-age=5' })
  } catch (err) {
    console.error(err)
    return json({ error: 'Leaderboard unavailable' }, 500)
  }
}
