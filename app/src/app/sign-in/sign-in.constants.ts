export const signInCopy = {
  HEADLINE: 'Reading for what you are stuck on, in the order that helps.',
  TAGLINE: 'Tell your assistant what you are stuck on. Each week, Afterword sends the papers and posts that help, in the order to read them.',
  GOOGLE: 'Continue with Google',
  DEMO: 'Use the demo account',
  DEMO_SUBMIT: 'Sign in',
  DEMO_EMAIL: 'demo@afterword.fyi',
  DEMO_HINT: 'Trying it out? The demo account already has notes and a briefing.',
  SAMPLE_KICKER: 'From a real briefing',
  SAMPLE_NOTE_LABEL: 'Stuck on',
  SAMPLE_NOTE: 'Intercoder reliability in reflexive thematic analysis of my interview transcripts.',
  STEPS_LABEL: 'How it works',
  ERROR_GENERIC: 'We could not sign you in. Please try again.',
  ERROR_CREDENTIALS: 'That email and password did not match. Please check them and try again.',
  ERROR_NETWORK: 'We could not reach the sign-in service. Check your connection and try again.',
} as const;

export const ignoredSignInErrorCodes = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'] as const;

export const signInSteps = [
  'Your assistant notes what you are stuck on as you work.',
  'Each week, Afterword finds papers and posts that answer it.',
  'You read them in order, save what helps, and your assistant can search it.',
] as const;

export const signInSampleEntries = [
  {
    rank: 1,
    readingNote: 'Start here: defines the agreement measures and thresholds',
    title: 'Inter-Coder Agreement in Qualitative Coding: Considerations for its Use',
    byline: 'Sean N. Halpin · 2024',
    whyThis:
      'Your kappa of 0.41 is hard to defend; this explains which agreement statistics exist, how to set a threshold, and how to document codebook changes.',
  },
  {
    rank: 2,
    readingNote: "Next: the method's own view of quality",
    title: 'A critical review of the reporting of reflexive thematic analysis',
    byline: 'Virginia Braun, Victoria Clarke · 2024',
    whyThis: 'Written by the authors of reflexive TA: shows what congruent reporting looks like.',
  },
] as const;
