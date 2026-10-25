import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Submission } from '../../src/shared/submission'
import { handleLeaderboard, handleSubmit } from './handlers'
import { StoreNotConfiguredError, type SubmissionStore } from './store'

const body = {
  attemptId: '3f2b8c1e-9a4d-4e2f-8b7a-1c2d3e4f5a6b',
  name: 'Ada',
  email: 'ada@example.com',
  score: 120,
  consent: true,
  marketingOptIn: true,
}

function post(payload: unknown): Request {
  return new Request('http://localhost/api/submit-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  })
}

function fakeStore(): SubmissionStore & { rows: Submission[] } {
  const rows: Submission[] = []
  return {
    rows,
    insert: vi.fn(async (s: Submission) => {
      if (rows.some((r) => r.attemptId === s.attemptId)) return false
      rows.push(s)
      return true
    }),
    rankFor: vi.fn(async () => 3),
    topScores: vi.fn(async () => [{ name: 'Ada', score: 120 }]),
  }
}

let store: ReturnType<typeof fakeStore>
beforeEach(() => {
  store = fakeStore()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('handleSubmit', () => {
  it('stores a valid submission and returns the rank without the email', async () => {
    const res = await handleSubmit(post(body), store)
    expect(res.status).toBe(201)
    const text = await res.text()
    expect(JSON.parse(text)).toEqual({ status: 'recorded', rank: 3 })
    expect(text).not.toContain('ada@example.com')
    expect(store.rows).toHaveLength(1)
    expect(store.rows[0]).toMatchObject({ gameId: 'ruby-slots', email: 'ada@example.com', marketingOptIn: true })
  })

  it('treats a retried attempt as already recorded and stores it once', async () => {
    await handleSubmit(post(body), store)
    const res = await handleSubmit(post(body), store)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'already_recorded' })
    expect(store.rows).toHaveLength(1)
  })

  it('rejects invalid data with field errors and stores nothing', async () => {
    const res = await handleSubmit(post({ ...body, email: 'nope', consent: false }), store)
    expect(res.status).toBe(400)
    const json = (await res.json()) as { status: string; errors: Record<string, string> }
    expect(json.status).toBe('invalid')
    expect(Object.keys(json.errors)).toEqual(expect.arrayContaining(['email', 'consent']))
    expect(store.insert).not.toHaveBeenCalled()
  })

  it('rejects malformed JSON', async () => {
    const res = await handleSubmit(post('{oops'), store)
    expect(res.status).toBe(400)
  })

  it('rejects non-POST requests', async () => {
    const res = await handleSubmit(new Request('http://localhost/api/submit-score'), store)
    expect(res.status).toBe(405)
  })

  it('returns a generic 500 when the database fails', async () => {
    store.insert = vi.fn(async () => {
      throw new Error('connection reset')
    })
    const res = await handleSubmit(post(body), store)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json).toEqual({ status: 'error', message: 'Could not save your score.' })
  })

  it('reports missing configuration as an error, never as success', async () => {
    store.insert = vi.fn(async () => {
      throw new StoreNotConfiguredError('missing env')
    })
    const res = await handleSubmit(post(body), store)
    expect(res.status).toBe(500)
    expect(((await res.json()) as { status: string }).status).toBe('error')
  })

  it('still reports success when only the rank lookup fails', async () => {
    store.rankFor = vi.fn(async () => {
      throw new Error('rpc failed')
    })
    const res = await handleSubmit(post(body), store)
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ status: 'recorded', rank: null })
  })
})

describe('handleLeaderboard', () => {
  it('returns names and scores', async () => {
    const res = await handleLeaderboard(new Request('http://localhost/api/leaderboard'), store)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ entries: [{ name: 'Ada', score: 120 }] })
  })

  it('returns 500 when the query fails', async () => {
    store.topScores = vi.fn(async () => {
      throw new Error('down')
    })
    const res = await handleLeaderboard(new Request('http://localhost/api/leaderboard'), store)
    expect(res.status).toBe(500)
  })
})
