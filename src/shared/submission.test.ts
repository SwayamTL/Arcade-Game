import { describe, expect, it } from 'vitest'
import { MAX_PLAUSIBLE_SCORE } from '../game/rules'
import { GAME_ID, validateSubmission } from './submission'

const valid = {
  attemptId: '3f2b8c1e-9a4d-4e2f-8b7a-1c2d3e4f5a6b',
  name: '  Ada   Lovelace ',
  email: ' Ada@Example.COM ',
  score: 120,
  consent: true,
  marketingOptIn: false,
}

describe('validateSubmission', () => {
  it('normalizes a valid submission', () => {
    const result = validateSubmission(valid)
    expect(result).toEqual({
      ok: true,
      value: {
        attemptId: valid.attemptId,
        gameId: GAME_ID,
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        score: 120,
        marketingOptIn: false,
      },
    })
  })

  it('requires consent', () => {
    const result = validateSubmission({ ...valid, consent: false })
    expect(result.ok).toBe(false)
    expect(!result.ok && result.errors.consent).toBeTruthy()
  })

  it.each([
    ['name', { name: '   ' }],
    ['name', { name: 'x'.repeat(41) }],
    ['email', { email: 'not-an-email' }],
    ['email', { email: `${'a'.repeat(250)}@x.io` }],
    ['score', { score: -1 }],
    ['score', { score: 1.5 }],
    ['score', { score: '100' }],
    ['score', { score: MAX_PLAUSIBLE_SCORE + 1 }],
    ['attemptId', { attemptId: 'abc' }],
    ['marketingOptIn', { marketingOptIn: 'yes' }],
  ])('rejects a bad %s', (field, patch) => {
    const result = validateSubmission({ ...valid, ...patch })
    expect(result.ok).toBe(false)
    expect(!result.ok && Object.keys(result.errors)).toContain(field)
  })

  it('rejects non-object input', () => {
    expect(validateSubmission(null).ok).toBe(false)
    expect(validateSubmission('hi').ok).toBe(false)
  })
})
