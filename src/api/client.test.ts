import { describe, expect, it, vi } from 'vitest'
import { submitScore } from './client'

const input = {
  attemptId: '3f2b8c1e-9a4d-4e2f-8b7a-1c2d3e4f5a6b',
  name: 'Ada',
  email: 'ada@example.com',
  score: 50,
  consent: true,
  marketingOptIn: false,
}

const respond = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch

describe('submitScore', () => {
  it('returns success with rank when recorded', async () => {
    expect(await submitScore(input, respond(201, { status: 'recorded', rank: 2 }))).toEqual({ kind: 'success', rank: 2 })
  })

  it('treats an already recorded attempt as success', async () => {
    expect(await submitScore(input, respond(200, { status: 'already_recorded' }))).toEqual({ kind: 'success', rank: null })
  })

  it('returns field errors on 400', async () => {
    const outcome = await submitScore(input, respond(400, { status: 'invalid', errors: { email: 'bad' } }))
    expect(outcome).toEqual({ kind: 'invalid', errors: { email: 'bad' } })
  })

  it('fails on a server error', async () => {
    expect((await submitScore(input, respond(500, { status: 'error', message: 'x' }))).kind).toBe('failed')
  })

  it('fails on a non-JSON response', async () => {
    const fetchImpl = vi.fn(async () => new Response('<html>', { status: 502 })) as unknown as typeof fetch
    expect((await submitScore(input, fetchImpl)).kind).toBe('failed')
  })

  it('fails on a network error', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    }) as unknown as typeof fetch
    expect((await submitScore(input, fetchImpl)).kind).toBe('failed')
  })
})
