// Server-only Supabase access. Uses the service-role key, so this must never be
// imported from browser code.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { LeaderboardEntry, Submission } from '../../src/shared/submission'

export interface SubmissionStore {
  // Returns false when this attemptId was already stored.
  insert(submission: Submission): Promise<boolean>
  rankFor(gameId: string, score: number): Promise<number>
  topScores(gameId: string, limit: number): Promise<LeaderboardEntry[]>
}

export class StoreNotConfiguredError extends Error {}

const UNIQUE_VIOLATION = '23505'

let client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (client) return client
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new StoreNotConfiguredError('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return client
}

export const supabaseStore: SubmissionStore = {
  async insert(s) {
    const { error } = await getClient().from('game_submissions').insert({
      attempt_id: s.attemptId,
      game_id: s.gameId,
      player_name: s.name,
      email: s.email,
      score: s.score,
      marketing_opt_in: s.marketingOptIn,
    })
    if (!error) return true
    if (error.code === UNIQUE_VIOLATION) return false
    throw new Error(`Insert failed: ${error.code} ${error.message}`)
  },

  async rankFor(gameId, score) {
    const { data, error } = await getClient().rpc('daily_rank', { p_game_id: gameId, p_score: score })
    if (error) throw new Error(`Rank query failed: ${error.code} ${error.message}`)
    return data as number
  },

  async topScores(gameId, limit) {
    const { data, error } = await getClient().rpc('daily_top_scores', { p_game_id: gameId, p_limit: limit })
    if (error) throw new Error(`Leaderboard query failed: ${error.code} ${error.message}`)
    return (data as { player_name: string; score: number }[]).map((row) => ({ name: row.player_name, score: row.score }))
  },
}
