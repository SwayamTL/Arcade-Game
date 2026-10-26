// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STAFF_RESET_HOLD_MS } from '../game/rules'
import { StaffReset } from './StaffReset'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function setup() {
  const onReset = vi.fn()
  render(
    <StaffReset onReset={onReset}>
      <h2>Ruby Slots</h2>
    </StaffReset>,
  )
  return { onReset, title: screen.getByText('Ruby Slots') }
}

describe('StaffReset', () => {
  it('resets after a full hold', () => {
    const { onReset, title } = setup()
    fireEvent.pointerDown(title)
    vi.advanceTimersByTime(STAFF_RESET_HOLD_MS - 1)
    expect(onReset).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('ignores taps and holds that end early', () => {
    const { onReset, title } = setup()
    fireEvent.pointerDown(title)
    vi.advanceTimersByTime(STAFF_RESET_HOLD_MS - 1)
    fireEvent.pointerUp(title)
    fireEvent.pointerDown(title)
    vi.advanceTimersByTime(STAFF_RESET_HOLD_MS / 2)
    fireEvent.pointerLeave(title)
    vi.advanceTimersByTime(STAFF_RESET_HOLD_MS)
    expect(onReset).not.toHaveBeenCalled()
  })
})
