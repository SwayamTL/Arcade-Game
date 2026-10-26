// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FULLSCREEN } from '../content/copy'
import { FullscreenButton } from './FullscreenButton'
import { useFullscreen } from './useFullscreen'

function Harness() {
  const ref = useRef<HTMLDivElement>(null)
  const { isFullscreen, toggle, message } = useFullscreen(ref)
  return (
    <div ref={ref} data-testid="root">
      <FullscreenButton isFullscreen={isFullscreen} message={message} onToggle={toggle} />
    </div>
  )
}

let fullscreenElement: Element | null = null

function setFullscreenElement(el: Element | null) {
  fullscreenElement = el
  document.dispatchEvent(new Event('fullscreenchange'))
}

beforeEach(() => {
  fullscreenElement = null
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => fullscreenElement })
  Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: true })
  document.exitFullscreen = vi.fn(async () => setFullscreenElement(null))
})

afterEach(() => {
  cleanup()
  // @ts-expect-error test stub cleanup
  delete HTMLElement.prototype.requestFullscreen
})

async function click() {
  await act(async () => screen.getByRole('button').click())
}

describe('useFullscreen', () => {
  it('enters and exits, following the browser state', async () => {
    const request = vi.fn(async function (this: HTMLElement) {
      setFullscreenElement(this)
    })
    HTMLElement.prototype.requestFullscreen = request
    render(<Harness />)
    expect(screen.getByRole('button', { name: FULLSCREEN.enter })).toBeTruthy()

    await click()
    expect(request.mock.contexts[0]).toBe(screen.getByTestId('root'))
    expect(screen.getByRole('button', { name: FULLSCREEN.exit })).toBeTruthy()

    await click()
    expect(document.exitFullscreen).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: FULLSCREEN.enter })).toBeTruthy()
  })

  it('resyncs when the user leaves with the browser controls', async () => {
    HTMLElement.prototype.requestFullscreen = vi.fn(async function (this: HTMLElement) {
      setFullscreenElement(this)
    })
    render(<Harness />)
    await click()
    act(() => setFullscreenElement(null))
    expect(screen.getByRole('button', { name: FULLSCREEN.enter })).toBeTruthy()
  })

  it('does not assume success when the request is rejected', async () => {
    HTMLElement.prototype.requestFullscreen = vi.fn(() => Promise.reject(new TypeError('denied')))
    render(<Harness />)
    await click()
    expect(screen.getByRole('button', { name: FULLSCREEN.enter })).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe(FULLSCREEN.blocked)
  })

  it('explains when fullscreen is unsupported', async () => {
    Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: false })
    render(<Harness />)
    await click()
    expect(screen.getByRole('status').textContent).toBe(FULLSCREEN.unsupported)
  })
})
