export const sendBriefingWarnings = {
  UNEXPECTED: 'Your briefing is ready, but we could not add the explanations or send the email. Please try again in a minute.',
} as const;

export const weeklyBriefingConfig = {
  SCHEDULE: 'every monday 07:00',
  TIME_ZONE: 'America/Denver',
  TIMEOUT_SECONDS: 540,
} as const;
