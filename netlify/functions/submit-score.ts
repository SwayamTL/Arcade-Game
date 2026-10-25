import type { Config } from '@netlify/functions'
import { handleSubmit } from '../lib/handlers'
import { supabaseStore } from '../lib/store'

export default (req: Request) => handleSubmit(req, supabaseStore)

export const config: Config = { path: '/api/submit-score' }
