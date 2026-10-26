// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Lever, type LeverState } from './Lever'

// jsdom has no layout, so give the track and knob the sizes they render at on a tablet.
const TRACK = 288
const KNOB = 36
const TRAVEL = TRACK - KNOB

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(TRACK)
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(KNOB)
  HTMLElement.prototype.setPointerCapture = vi.fn()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function setup(state: LeverState = 'ready') {
  const onPull = vi.fn()
  const onWrong = vi.fn()
  render(<Lever state={state} onPull={onPull} onWrong={onWrong} />)
  const lever = screen.getByRole('button', { name: 'Pull the lever' })
  const knob = lever.firstElementChild as HTMLElement
  return { onPull, onWrong, lever, knob }
}

const pointer = { pointerId: 1, button: 0 }

function drag(lever: HTMLElement, toY: number) {
  fireEvent.pointerDown(lever, { ...pointer, clientY: 100 })
  fireEvent.pointerMove(lever, { ...pointer, clientY: 100 + toY })
}

describe('Lever', () => {
  it('lets the knob travel to the bottom of the track and no further', () => {
    const { lever, knob } = setup()
    drag(lever, 400)
    expect(knob.style.transform).toBe(`translateY(${TRAVEL}px)`)
    fireEvent.pointerMove(lever, { ...pointer, clientY: 50 })
    expect(knob.style.transform).toBe('')
  })

  it('spins when released at the bottom, then snaps back', () => {
    const { onPull, lever, knob } = setup()
    drag(lever, TRAVEL)
    fireEvent.pointerUp(lever, pointer)
    expect(onPull).toHaveBeenCalledOnce()
    expect(knob.style.transform).toBe('')
  })

  it('spins when released past halfway', () => {
    const { onPull, lever } = setup()
    drag(lever, TRAVEL * 0.55)
    fireEvent.pointerUp(lever, pointer)
    expect(onPull).toHaveBeenCalledOnce()
  })

  it('snaps back without spinning on a short pull', () => {
    const { onPull, lever, knob } = setup()
    drag(lever, TRAVEL * 0.3)
    fireEvent.pointerUp(lever, pointer)
    expect(onPull).not.toHaveBeenCalled()
    expect(knob.style.transform).toBe('')
  })

  it('spins on a tap', () => {
    const { onPull, lever } = setup()
    fireEvent.pointerDown(lever, { ...pointer, clientY: 100 })
    fireEvent.pointerUp(lever, pointer)
    expect(onPull).toHaveBeenCalledOnce()
  })

  it('does not spin when the pointer is cancelled', () => {
    const { onPull, lever, knob } = setup()
    drag(lever, TRAVEL)
    fireEvent.pointerCancel(lever, pointer)
    fireEvent.pointerUp(lever, pointer)
    expect(onPull).not.toHaveBeenCalled()
    expect(knob.style.transform).toBe('')
  })

  it('works with touch pointers', () => {
    const { onPull, lever } = setup()
    fireEvent.pointerDown(lever, { ...pointer, pointerType: 'touch', clientY: 100 })
    fireEvent.pointerMove(lever, { ...pointer, pointerType: 'touch', clientY: 100 + TRAVEL })
    fireEvent.pointerUp(lever, { ...pointer, pointerType: 'touch' })
    expect(onPull).toHaveBeenCalledOnce()
  })

  it('reports a wrong press while the reels spin, without moving', () => {
    const { onPull, onWrong, lever, knob } = setup('busy')
    drag(lever, TRAVEL)
    fireEvent.pointerUp(lever, pointer)
    expect(onWrong).toHaveBeenCalledOnce()
    expect(onPull).not.toHaveBeenCalled()
    expect(knob.style.transform).toBe('')
  })

  it('ignores input when off', () => {
    const { onPull, onWrong, lever, knob } = setup('off')
    drag(lever, TRAVEL)
    fireEvent.pointerUp(lever, pointer)
    expect(onPull).not.toHaveBeenCalled()
    expect(onWrong).not.toHaveBeenCalled()
    expect(knob.style.transform).toBe('')
  })
})
