// Small, best-effort feedback for the machine's controls. Every call is a no-op where the
// browser lacks the API (jsdom, iOS Safari has no vibration).

function reducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Vibration is optional.
  }
}

// Points the player at the control they should have used: a short shake, or an outline
// pulse when reduced motion is requested.
export function nudge(el: HTMLElement | null) {
  buzz([30, 40, 30])
  if (!el?.animate) return
  if (reducedMotion()) {
    el.animate(
      [
        { outline: '3px solid var(--color-accent)', outlineOffset: '4px' },
        { outline: '3px solid transparent', outlineOffset: '4px' },
      ],
      { duration: 700, easing: 'ease-out' },
    )
    return
  }
  el.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-7px)' },
      { transform: 'translateX(7px)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(0)' },
    ],
    { duration: 420, easing: 'ease-in-out' },
  )
}
