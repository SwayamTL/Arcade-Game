// End-of-round name/email form: validates, submits the score and retries with the same attemptId.
// Submitting is the only way past it (no skip), so every round feeds the booth's email list.
import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { submitScore } from '../api/client'
import { FORM } from '../content/copy'
import { EMAIL_MAX, NAME_MAX, validateSubmission, type FieldErrors } from '../shared/submission'

interface PlayerFormProps {
  score: number
  attemptId: string
  onSubmitted: (rank: number | null) => void
  submit?: typeof submitScore
}

type Status = { kind: 'idle' } | { kind: 'submitting' } | { kind: 'failed'; message: string }

export function PlayerForm({ score, attemptId, onSubmitted, submit = submitScore }: PlayerFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  // Guards against double taps before React re-renders the disabled button.
  const inFlight = useRef(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (inFlight.current) return

    // The attemptId comes from the finished round and never changes, so a retry
    // after a failure can't create a second row.
    const input = { attemptId, name, email, score, consent, marketingOptIn }
    const check = validateSubmission(input)
    if (!check.ok) {
      setErrors(check.errors)
      return
    }

    inFlight.current = true
    setErrors({})
    setStatus({ kind: 'submitting' })
    const outcome = await submit(input)
    inFlight.current = false

    if (outcome.kind === 'success') {
      onSubmitted(outcome.rank)
    } else if (outcome.kind === 'invalid') {
      setErrors(outcome.errors)
      setStatus({ kind: 'idle' })
    } else {
      setStatus({ kind: 'failed', message: outcome.message })
    }
  }

  const submitting = status.kind === 'submitting'
  const otherError = errors.score ?? errors.attemptId ?? errors.marketingOptIn

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <h3 className="text-lg font-medium">{FORM.heading}</h3>

      <Field label={FORM.nameLabel} error={errors.name} id="player-name">
        <input
          id="player-name"
          name="name"
          autoComplete="off"
          maxLength={NAME_MAX}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'player-name-error' : undefined}
          className={inputClass(!!errors.name)}
        />
      </Field>

      <Field label={FORM.emailLabel} error={errors.email} id="player-email">
        <input
          id="player-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="off"
          maxLength={EMAIL_MAX}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'player-email-error' : undefined}
          className={inputClass(!!errors.email)}
        />
      </Field>

      <div>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            aria-invalid={!!errors.consent}
            aria-describedby={errors.consent ? 'consent-error' : undefined}
            className="mt-0.5 size-5 shrink-0 accent-accent"
          />
          <span>{FORM.consentLabel}</span>
        </label>
        {errors.consent && (
          <p id="consent-error" className="mt-1 text-sm text-danger">
            {errors.consent}
          </p>
        )}
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={marketingOptIn}
          onChange={(e) => setMarketingOptIn(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-accent"
        />
        <span>{FORM.marketingLabel}</span>
      </label>

      <p className="text-xs text-ink/60">{FORM.privacyNote}</p>

      {otherError && <p className="text-sm text-danger">{otherError}</p>}
      {status.kind === 'failed' && (
        <p role="alert" className="text-sm text-danger">
          {status.message}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl border-2 border-ink bg-accent px-6 py-3 font-medium text-white disabled:opacity-60"
        >
          {submitting ? FORM.submitting : status.kind === 'failed' ? FORM.retry : FORM.submit}
        </button>
      </div>
    </form>
  )
}

function inputClass(invalid: boolean): string {
  return `w-full rounded-xl border-2 bg-surface px-4 py-3 text-base outline-none focus:border-accent ${
    invalid ? 'border-danger' : 'border-ink/30'
  }`
}

function Field({ label, error, id, children }: { label: string; error?: string; id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
