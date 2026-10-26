import { FULLSCREEN } from '../content/copy'
import { releasePointerFocus } from './useFullscreen'

interface FullscreenButtonProps {
  isFullscreen: boolean
  message: string | null
  onToggle: () => void
}

export function FullscreenIcon({ exit = false, className = 'size-5' }: { exit?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      {exit ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /> : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
    </svg>
  )
}

export function FullscreenButton({ isFullscreen, message, onToggle }: FullscreenButtonProps) {
  const label = isFullscreen ? FULLSCREEN.exit : FULLSCREEN.enter

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          releasePointerFocus(e)
          onToggle()
        }}
        // Keyboard users who tab here get native Space/Enter instead of the game shortcut.
        data-native-keys
        aria-label={label}
        title={label}
        className="flex size-11 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
      >
        <FullscreenIcon exit={isFullscreen} />
      </button>
      <p
        role="status"
        className={`absolute top-full right-0 z-10 mt-2 w-64 rounded-lg bg-ink px-3 py-2 text-xs leading-snug text-white shadow-lg ${message ? '' : 'sr-only'}`}
      >
        {message}
      </p>
    </div>
  )
}
