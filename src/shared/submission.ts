// Submission contract shared by the browser form and the submit-score Netlify Function.
// The server always re-validates; the client uses this for instant feedback only.

import { MAX_PLAUSIBLE_SCORE } from '../game/rules'

export const GAME_ID = 'ruby-slots'

export const NAME_MAX = 40
export const EMAIL_MAX = 254

export interface SubmissionInput {
  attemptId: string
  name: string
  email: string
  score: number
  consent: boolean
  marketingOptIn: boolean
}

export interface Submission {
  attemptId: string
  gameId: typeof GAME_ID
  name: string
  email: string
  score: number
  marketingOptIn: boolean
}

export type SubmissionField = 'attemptId' | 'name' | 'email' | 'score' | 'consent' | 'marketingOptIn'
export type FieldErrors = Partial<Record<SubmissionField, string>>

export type ValidationResult = { ok: true; value: Submission } | { ok: false; errors: FieldErrors }

// Server responses. Never include the email.
export type SubmitResponse =
  | { status: 'recorded'; rank: number | null }
  | { status: 'already_recorded' }
  | { status: 'invalid'; errors: FieldErrors }
  | { status: 'error'; message: string }

export interface LeaderboardEntry {
  name: string
  score: number
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u001f\u007f]/

export function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}

export function validateSubmission(input: unknown): ValidationResult {
  const data = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>
  const errors: FieldErrors = {}

  const attemptId = typeof data.attemptId === 'string' ? data.attemptId : ''
  if (!UUID_RE.test(attemptId)) errors.attemptId = 'Missing game attempt. Please play again.'

  const name = typeof data.name === 'string' ? normalizeName(data.name) : ''
  if (!name) errors.name = 'Enter a name for the leaderboard.'
  else if (name.length > NAME_MAX) errors.name = `Keep your name under ${NAME_MAX + 1} characters.`
  else if (CONTROL_RE.test(name)) errors.name = 'That name has characters we can’t show.'

  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : ''
  if (!email) errors.email = 'Enter your email.'
  else if (email.length > EMAIL_MAX || !EMAIL_RE.test(email)) errors.email = 'That email doesn’t look right.'

  const score = data.score
  if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > MAX_PLAUSIBLE_SCORE) {
    errors.score = 'That score isn’t valid.'
  }

  if (data.consent !== true) errors.consent = 'Please agree so we can store your score.'

  if (data.marketingOptIn !== undefined && typeof data.marketingOptIn !== 'boolean') {
    errors.marketingOptIn = 'Invalid choice.'
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    value: {
      attemptId: attemptId.toLowerCase(),
      gameId: GAME_ID,
      name,
      email,
      score: score as number,
      marketingOptIn: data.marketingOptIn === true,
    },
  }
}
