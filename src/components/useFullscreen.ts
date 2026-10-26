import { useCallback, useEffect, useState, type MouseEvent, type RefObject } from 'react'
import { FULLSCREEN } from '../content/copy'

const MESSAGE_MS = 5000

// A mouse or touch click must not leave focus on a fullscreen control, or Space/Enter would
// toggle fullscreen instead of stopping the reels. Keyboard activation (detail 0) keeps focus.
export function releasePointerFocus(e: MouseEvent<HTMLElement>) {
  if (e.detail > 0) e.currentTarget.blur()
}

// Tracks the browser's real fullscreen state rather than trusting the button click, so Esc
// and the browser's own controls keep the UI in sync. Standard Fullscreen API only.
export function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const onChange = () => {
      const active = document.fullscreenElement != null && document.fullscreenElement === ref.current
      setIsFullscreen(active)
      if (active) setMessage(null)
    }
    const onError = () => setMessage(FULLSCREEN.blocked)
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('fullscreenerror', onError)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('fullscreenerror', onError)
    }
  }, [ref])

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), MESSAGE_MS)
    return () => clearTimeout(timer)
  }, [message])

  // Must run straight from the click so the request counts as a user gesture.
  const toggle = useCallback(async () => {
    const el = ref.current
    if (!el) return
    if (document.fullscreenElement) {
      await document.exitFullscreen?.().catch(() => {})
      return
    }
    if (!document.fullscreenEnabled || typeof el.requestFullscreen !== 'function') {
      setMessage(FULLSCREEN.unsupported)
      return
    }
    try {
      await el.requestFullscreen({ navigationUI: 'hide' })
    } catch {
      setMessage(FULLSCREEN.blocked)
    }
  }, [ref])

  return { isFullscreen, toggle, message }
}
