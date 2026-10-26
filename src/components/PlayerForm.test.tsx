// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SubmitOutcome } from '../api/client'
import type { SubmissionInput } from '../shared/submission'
import { PlayerForm } from './PlayerForm'

const attemptId = '3f2b8c1e-9a4d-4e2f-8b7a-1c2d3e4f5a6b'

afterEach(cleanup)

function fillValid() {
  fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'Ada' } })
  fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: 'ada@example.com' } })
  fireEvent.click(screen.getByLabelText(/I agree/))
}

describe('PlayerForm', () => {
  it('shows validation errors without calling the server', async () => {
    const submit = vi.fn()
    render(<PlayerForm score={10} attemptId={attemptId} onSubmitted={vi.fn()} submit={submit} />)
    fireEvent.click(screen.getByRole('button', { name: 'Submit score' }))
    expect(await screen.findByText('Enter a name for the leaderboard.')).toBeTruthy()
    expect(screen.getByText('Please agree so we can store your score.')).toBeTruthy()
    expect(submit).not.toHaveBeenCalled()
  })

  it('sends one request per tap and retries with the same attemptId', async () => {
    let resolveFirst: (o: SubmitOutcome) => void = () => {}
    const submit = vi
      .fn<(input: SubmissionInput) => Promise<SubmitOutcome>>()
      .mockImplementationOnce(() => new Promise((r) => (resolveFirst = r)))
      .mockResolvedValueOnce({ kind: 'success', rank: 1 })
    const onSubmitted = vi.fn()
    render(<PlayerForm score={10} attemptId={attemptId} onSubmitted={onSubmitted} submit={submit} />)
    fillValid()

    const button = screen.getByRole('button', { name: 'Submit score' })
    fireEvent.click(button)
    fireEvent.click(button)
    expect(submit).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Saving…' })).toHaveProperty('disabled', true)

    resolveFirst({ kind: 'failed', message: 'Couldn’t reach the server.' })
    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(onSubmitted).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledWith(1))
    expect(submit).toHaveBeenCalledTimes(2)
    expect(submit.mock.calls[0][0].attemptId).toBe(attemptId)
    expect(submit.mock.calls[1][0].attemptId).toBe(attemptId)
  })

  it('shows server field errors', async () => {
    const submit = vi.fn(async (): Promise<SubmitOutcome> => ({ kind: 'invalid', errors: { email: 'Server says no.' } }))
    render(<PlayerForm score={10} attemptId={attemptId} onSubmitted={vi.fn()} submit={submit} />)
    fillValid()
    fireEvent.click(screen.getByRole('button', { name: 'Submit score' }))
    expect(await screen.findByText('Server says no.')).toBeTruthy()
  })
})
