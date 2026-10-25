// All user-facing text. Strings marked REVIEW have not been approved by RailsFactory yet
// and must be signed off before the booth goes live.

import type { Outcome } from '../game/scoring'

export const EVENT = {
  // Taken from the arcade reference screenshot.
  name: 'RubyConf India 2026',
  dateVenue: '21 November, Novotel Hyderabad Airport',
  booth: 'Find us at the RailsFactory booth',
}

export const SITE = {
  title: 'RubyConf India Arcade',
  tagline: 'Play a quick game, leave your name, and see where you land on today’s board.',
}

export const GAME = {
  name: 'Ruby Slots',
  short: 'Stop on three rubies',
  howTo: 'Pull, then stop each reel left to right. Line up 💎💎💎 for the big score. Keep a streak going to multiply your points. You have 45 seconds.',
  keyHint: 'Space or Enter works too',
}

export const OUTCOME_COPY: Record<Outcome, string> = {
  jackpot: 'Three rubies!',
  triple: 'Triple!',
  pair: 'Pair',
  bug: 'Production bug. Streak lost.',
  miss: 'No match. Streak lost.',
}

export const RESULT = {
  // From the arcade reference screenshot.
  pitch:
    'Lining up three things at exactly the right moment is how a Rails upgrade feels too: code, tests and deploy. RailsFactory gets all three to land. Ask us at the booth.',
}

export const ABOUT = {
  // From the arcade reference screenshot.
  heading: 'Who’s RailsFactory?',
  body: 'The Ruby on Rails team inside Sedin Technologies. We upgrade, rescue, speed up and scale Rails apps, and extend teams with Rails engineers.',
}

export const FORM = {
  heading: 'Put your score on the board',
  nameLabel: 'Name (shown on the leaderboard)',
  emailLabel: 'Email (never shown publicly)',
  // REVIEW: privacy notice wording and the missing privacy policy link need RailsFactory approval.
  consentLabel:
    'I agree that RailsFactory stores my name, email and score for this RubyConf India game. My name and score may appear on today’s leaderboard. My email is never shown.',
  // REVIEW: marketing opt-in wording needs RailsFactory approval.
  marketingLabel: 'Also email me about RailsFactory’s Rails services (optional).',
  // REVIEW: retention period and contact address for deletion requests are placeholders.
  privacyNote: 'Want your details removed? Ask anyone at the RailsFactory booth.',
  submit: 'Submit score',
  submitting: 'Saving…',
  retry: 'Try again',
  skip: 'Skip, next player',
}
