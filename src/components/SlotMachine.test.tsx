// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NUDGE } from '../content/copy'
import { ROUND_MS } from '../game/rules'
import type { GameView } from '../game/useSlotGame'
import { FullscreenButton } from './FullscreenButton'
import { SlotMachine } from './SlotMachine'

const ready: GameView = {
  phase: 'ready',
  score: 0,
  streak: 0,
  stoppedCount: 0,
  spins: 0,
  jackpots: 0,
  lastSpin: null,
  timeLeftMs: ROUND_MS,
  locked: false,
  attemptId: null,
}
const spinning: GameView = { ...ready, phase: 'spinning', spins: 1 }

// jsdom has no Web Animations API; record which element each nudge shakes.
const animate = vi.fn()
beforeEach(() => {
  animate.mockReset()
  HTMLElement.prototype.animate = function (this: HTMLElement, ...args: unknown[]) {
    animate(this, ...args)
    return {} as Animation
  } as HTMLElement['animate']
})

afterEach(cleanup)

function setup(view: GameView, stopAccepted = view.phase === 'spinning') {
  const pull = vi.fn(() => view.phase !== 'spinning')
  const stop = vi.fn(() => stopAccepted)
  const toggle = vi.fn()
  render(
    <SlotMachine
      view={view}
      initialOffsets={[0, 0, 0]}
      pull={pull}
      stop={stop}
      reset={() => {}}
      setStripEl={() => {}}
      resultPanel={null}
      fill={false}
      fullscreenControl={<FullscreenButton isFullscreen={false} message={null} onToggle={toggle} />}
    />,
  )
  return {
    pull,
    stop,
    toggle,
    lever: screen.getByRole('button', { name: 'Pull the lever' }),
    stopButton: screen.getByRole('button', { name: /^Stop/ }),
    fullscreenButton: screen.getByRole('button', { name: 'Enter Full Screen' }),
  }
}

const shaken = () => animate.mock.calls.map(([el]) => el)

describe('SlotMachine controls', () => {
  it('does not start a round from Space; it shakes the lever instead', () => {
    const { pull, lever } = setup(ready)
    fireEvent.keyDown(document.body, { code: 'Space' })
    expect(pull).not.toHaveBeenCalled()
    expect(shaken()).toEqual([lever])
    expect(screen.getByText(NUDGE.pull)).toBeTruthy()
  })

  it('shakes the lever when Stop is pressed between spins', () => {
    const { lever, stopButton } = setup(ready)
    fireEvent.click(stopButton)
    expect(shaken()).toEqual([lever])
  })

  it('pulls with ArrowDown', () => {
    const { pull } = setup(ready)
    fireEvent.keyDown(document.body, { code: 'ArrowDown' })
    expect(pull).toHaveBeenCalledOnce()
  })

  it('stops reels with Space and Enter while spinning', () => {
    const { stop } = setup(spinning)
    fireEvent.keyDown(document.body, { code: 'Space' })
    fireEvent.keyDown(document.body, { code: 'Enter' })
    expect(stop).toHaveBeenCalledTimes(2)
    expect(animate).not.toHaveBeenCalled()
  })

  it('quietly ignores a Stop pressed in the first moments of a spin', () => {
    const { stop } = setup(spinning, false)
    fireEvent.keyDown(document.body, { code: 'Space' })
    expect(stop).toHaveBeenCalledOnce()
    expect(animate).not.toHaveBeenCalled()
  })

  it('shows a bug penalty as negative points', () => {
    setup({
      ...ready,
      phase: 'scored',
      lastSpin: { outcome: 'bugged', matchPoints: 0, multiplier: 1, bugs: 1, points: -10, streak: 0 },
    })
    expect(screen.getByText('Bug shipped. Streak lost.')).toBeTruthy()
    expect(screen.getByText('🐛 −10', { exact: false }).className).toContain('text-danger')
  })

  it('shows how a match with a bug adds up', () => {
    setup({
      ...ready,
      phase: 'scored',
      lastSpin: { outcome: 'pair', matchPoints: 10, multiplier: 2, bugs: 1, points: 10, streak: 0 },
    })
    const line = screen.getByText('Pair').parentElement!
    expect(line.textContent).toBe('Pair +20 (×2) · 🐛 −10 = +10 Streak lost.')
  })

  it('shows a cancelled-out match as = 0', () => {
    setup({
      ...ready,
      phase: 'scored',
      lastSpin: { outcome: 'pair', matchPoints: 10, multiplier: 1, bugs: 1, points: 0, streak: 0 },
    })
    expect(screen.getByText('Pair').parentElement!.textContent).toBe('Pair +10 · 🐛 −10 = 0 Streak lost.')
  })

  it('shakes Stop when the lever is used mid-spin', () => {
    const { pull, lever, stopButton } = setup(spinning)
    fireEvent.pointerDown(lever, { pointerId: 1, button: 0, clientY: 10 })
    fireEvent.keyDown(document.body, { code: 'ArrowDown' })
    expect(pull).not.toHaveBeenCalled()
    expect(shaken()).toEqual([stopButton, stopButton])
    expect(screen.getByText(NUDGE.stop)).toBeTruthy()
  })
})

describe('SlotMachine and the fullscreen button', () => {
  it('still stops the reels with Space after the fullscreen button was clicked', () => {
    const { stop, toggle, fullscreenButton } = setup(spinning)
    fullscreenButton.focus()
    fireEvent.click(fullscreenButton, { detail: 1 })
    expect(toggle).toHaveBeenCalledOnce()
    expect(document.activeElement).not.toBe(fullscreenButton)

    fireEvent.keyDown(document.activeElement ?? document.body, { code: 'Space' })
    fireEvent.keyDown(document.activeElement ?? document.body, { code: 'Enter' })
    expect(stop).toHaveBeenCalledTimes(2)
  })

  it('leaves Space/Enter to the fullscreen button when a keyboard user tabbed to it', () => {
    const { stop, fullscreenButton } = setup(spinning)
    fullscreenButton.focus()
    fireEvent.keyDown(fullscreenButton, { code: 'Enter' })
    expect(stop).not.toHaveBeenCalled()
  })
})
