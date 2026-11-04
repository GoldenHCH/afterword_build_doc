export const signInCopy = {
  TAGLINE: 'Tell your assistant what you are stuck on. Each week, Afterword sends the papers and posts that help, in the order to read them.',
  GOOGLE: 'Continue with Google',
  DEMO: 'Use the demo account',
  DEMO_SUBMIT: 'Sign in',
  DEMO_EMAIL: 'demo@afterword.fyi',
  ERROR_GENERIC: 'We could not sign you in. Please try again.',
  ERROR_CREDENTIALS: 'That email and password did not match. Please check them and try again.',
  ERROR_NETWORK: 'We could not reach the sign-in service. Check your connection and try again.',
} as const;

export const ignoredSignInErrorCodes = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'] as const;
