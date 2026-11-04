export const emailConfig = {
  FROM: 'Afterword <briefing@afterword.fyi>',
  APP_URL: 'https://afterword.fyi',
  RESEND_URL: 'https://api.resend.com/emails',
  MAX_HTML_BYTES: 100000,
  TIMEOUT_MS: 15000,
  MAX_AUTHORS: 3,
  MAX_SUBJECT_SUMMARY_LENGTH: 60,
} as const;

export const emailCopy = {
  SUBJECT_PREFIX: 'Afterword',
  BRAND: 'Afterword',
  FALLBACK_NAME: 'there',
  GREETING_LEAD: 'Here is your reading for the week, in the order that will help most.',
  PREHEADER_SUFFIX: 'papers and posts, in reading order.',
  ET_AL: 'et al.',
  SAVE: 'Save',
  OPEN_APP: 'Open Afterword',
  FOOTER_SOLVED: "Solved it? Tell your assistant and it leaves next week's briefing.",
  MORE_NOTE: 'more note',
  MORE_NOTES: 'more notes',
  ELLIPSIS: '…',
  MONTHS: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
} as const;

export const emailKindLabels = {
  STUCK: 'stuck on',
  WORKING_ON: 'working on',
  QUESTION: 'question',
} as const;

export const emailTheme = {
  PAGE_BACKGROUND: '#FAFBFC',
  CARD_BACKGROUND: '#FFFFFF',
  ACCENT: '#C4343F',
  TEXT: '#1A1F27',
  MUTED: '#556070',
  LINK: '#1C3A8E',
  RULE: '#C7D5EA',
  BODY_FONT: 'Arial, Helvetica, sans-serif',
  HEADING_FONT: 'Georgia, serif',
} as const;

export const emailErrors = {
  MISSING_KEY: 'The briefing is ready, but email sending is not set up yet, so nothing was sent.',
  PROVIDER_REJECTED: 'The email service turned the briefing down, so nothing was sent.',
  PROVIDER_AUTH: 'The email service did not accept our sending credentials, so nothing was sent.',
  PROVIDER_UNCONFIRMED:
    'The email service did not confirm the send, so we are not sure it went out. Please check your inbox before trying again.',
  PROVIDER_RATE_LIMITED: 'The email service is busy right now, so nothing was sent. Please try again in a minute.',
  NETWORK: 'We could not reach the email service, so nothing was sent. Please try again in a minute.',
  NO_RECIPIENT: 'This account has no email address, so the briefing was not sent.',
  BRIEFING_NOT_FOUND: 'We could not find that briefing, so nothing was sent.',
  UNKNOWN: 'Something went wrong while sending the briefing, so nothing was sent.',
} as const;
