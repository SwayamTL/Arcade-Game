// Hidden staff control: holding the wrapped element for STAFF_RESET_HOLD_MS calls onReset.
// Used on the machine title so staff can clear an abandoned round or result screen.
import { useEffect, useRef, type ReactNode } from 'react'
import { STAFF_RESET_HOLD_MS } from '../game/rules'
import { buzz } from './feedback'

export function StaffReset({ onReset, children }: { onReset: () => void; children: ReactNode }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }
  useEffect(() => cancel, [])

  return (
    <div
      // No visible affordance on purpose. select-none and the callout rule stop a touch
      // long-press from selecting text or opening the browser menu instead.
      className="select-none [-webkit-touch-callout:none]"
      onPointerDown={() => {
        cancel()
        timer.current = setTimeout(() => {
          timer.current = null
          buzz(60)
          onReset()
        }, STAFF_RESET_HOLD_MS)
      }}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </div>
  )
}
