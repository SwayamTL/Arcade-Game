import type { Config } from '@netlify/functions'
import { handleLeaderboard } from '../lib/handlers'
import { supabaseStore } from '../lib/store'

export default (req: Request) => handleLeaderboard(req, supabaseStore)

export const config: Config = { path: '/api/leaderboard' }
