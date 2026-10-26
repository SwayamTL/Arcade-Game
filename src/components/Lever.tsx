import { useEffect, useRef, type PointerEvent, type RefObject } from 'react'
import { LEVER_PULL_FRACTION } from '../game/rules'

// ready: can be pulled. busy: the reels are spinning, so a press is the wrong control.
// off: the round is over or the result is still showing.
export type LeverState = 'ready' | 'busy' | 'off'

interface LeverProps {
  state: LeverState
  onPull: () => void
  onWrong: () => void
  // Lets the machine shake the lever when the wrong control is used.
  buttonRef?: RefObject<HTMLButtonElement | null>
}

// Movement below this many pixels counts as a tap, not a drag.
const TAP_PX = 6
const SNAP_BACK = 'transform 200ms ease-out'

interface Drag {
  pointerId: number
  startY: number
  travel: number
  y: number
  moved: number
}

function moveKnob(knob: HTMLElement | null, y: number, transition: string) {
  if (!knob) return
  knob.style.transition = transition
  knob.style.transform = y ? `translateY(${y}px)` : ''
}

// The knob follows the pointer down its track. Like the reels, its transform is written
// straight to the DOM. Travel is measured from the rendered track on every press, so it
// stays right across resizes, orientation changes and fullscreen.
export function Lever({ state, onPull, onWrong, buttonRef }: LeverProps) {
  const ownRef = useRef<HTMLButtonElement>(null)
  const trackRef = buttonRef ?? ownRef
  const knobRef = useRef<HTMLSpanElement>(null)
  const drag = useRef<Drag | null>(null)

  const setKnob = (y: number, transition: string) => moveKnob(knobRef.current, y, transition)

  const snapBack = () => {
    drag.current = null
    setKnob(0, SNAP_BACK)
  }

  const ready = state === 'ready'

  // The round can end mid-drag; never leave the knob halfway down.
  useEffect(() => {
    if (!ready && drag.current) {
      drag.current = null
      moveKnob(knobRef.current, 0, SNAP_BACK)
    }
  }, [ready])

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    const track = trackRef.current
    const knob = knobRef.current
    if (e.button !== 0 || !track || !knob || drag.current) return
    if (state === 'busy') {
      e.preventDefault()
      onWrong()
      return
    }
    if (!ready) return
    e.preventDefault()
    try {
      track.setPointerCapture?.(e.pointerId)
    } catch {
      // The pointer is already gone; the drag still works without capture.
    }
    drag.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      travel: Math.max(0, track.clientHeight - knob.offsetHeight),
      y: 0,
      moved: 0,
    }
    setKnob(0, 'none')
  }

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (!d || e.pointerId !== d.pointerId) return
    const dy = e.clientY - d.startY
    d.moved = Math.max(d.moved, Math.abs(dy))
    d.y = Math.min(Math.max(dy, 0), d.travel)
    setKnob(d.y, 'none')
  }

  const onPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (!d || e.pointerId !== d.pointerId) return
    // Pointer capture is released implicitly after pointerup.
    const tap = d.moved < TAP_PX
    const pulled = tap || d.y >= d.travel * LEVER_PULL_FRACTION
    snapBack()
    if (tap) {
      knobRef.current?.animate?.(
        [{ transform: 'none' }, { transform: `translateY(${d.travel}px)` }, { transform: 'none' }],
        { duration: 300, easing: 'ease-in-out' },
      )
    }
    if (pulled && ready) onPull()
  }

  const onPointerCancel = (e: PointerEvent<HTMLButtonElement>) => {
    if (drag.current?.pointerId === e.pointerId) snapBack()
  }

  return (
    <button
      ref={trackRef}
      type="button"
      // Pointer users pull via the handlers above; keep assistive-tech activation working.
      onClick={(e) => {
        if (e.detail !== 0) return
        if (ready) onPull()
        else if (state === 'busy') onWrong()
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onLostPointerCapture={onPointerCancel}
      // Busy stays focusable and pressable so a wrong press can point at the Stop button.
      disabled={state === 'off'}
      aria-disabled={!ready}
      className={`flex h-[calc(var(--cell)*3)] w-14 shrink-0 touch-none flex-col items-center transition-opacity select-none ${
        ready ? 'cursor-grab active:cursor-grabbing' : 'opacity-40'
      }`}
      aria-label="Pull the lever"
    >
      <span ref={knobRef} className="size-9 rounded-full border-2 border-ink bg-accent-bright" />
      <span className="w-2 flex-1 rounded-b bg-ink" />
    </button>
  )
}
