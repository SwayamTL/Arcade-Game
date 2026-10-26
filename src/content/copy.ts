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
  howTo:
    'Pull the lever, then hit Stop on each reel. 2 alike = 10, 3 alike = 50, 💎 pays double. Streaks multiply matches. Each 🐛 is −10 and breaks your streak.',
  keyHint: 'Keyboard: ↓ pulls the lever, Space or Enter stops a reel.',
  stop: 'Stop',
}

export const OUTCOME_COPY: Record<Outcome, string> = {
  jackpot: 'Three rubies!',
  triple: 'Triple!',
  rubyPair: 'Ruby pair!',
  pair: 'Pair',
  bug: 'Production outage!',
  bugged: 'Bug shipped. Streak lost.',
  miss: 'No match. Streak lost.',
}

// Added when a match also had a bug on the line.
export const STREAK_LOST = 'Streak lost.'

// Shown when the player uses the wrong control.
export const NUDGE = {
  pull: 'Pull the lever to spin',
  stop: 'Hit Stop to stop the reels',
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
  heading: 'Put your score on the leaderboard and be eligible for prizes',
  nameLabel: 'Name',
  emailLabel: 'Email',
  // REVIEW: privacy notice wording and the missing privacy policy link need RailsFactory approval.
  consentLabel:
    'I agree that RailsFactory stores my name, email and score for this RubyConf India game.',
  // REVIEW: marketing opt-in wording needs RailsFactory approval.
  marketingLabel: 'Also email me about RailsFactory’s Rails services (optional).',
  // REVIEW: retention period and contact address for deletion requests are placeholders.
  privacyNote: 'Want your details removed? Ask anyone at the RailsFactory booth.',
  submit: 'Submit score',
  submitting: 'Saving…',
  retry: 'Try again',
  skip: 'Skip, next player',
}

export const FULLSCREEN = {
  enter: 'Enter Full Screen',
  exit: 'Exit Full Screen',
  tileHint: 'Tap to play full screen',
  unsupported: 'Full screen isn’t available in this browser. Use the tablet’s kiosk mode instead.',
  blocked: 'The browser blocked full screen. Try again, or use the tablet’s kiosk mode.',
}
