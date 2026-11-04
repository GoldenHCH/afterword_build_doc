export const collections = {
  USERS: 'users',
  NOTES: 'notes',
  BRIEFINGS: 'briefings',
  LIBRARY: 'library',
} as const;

export const callableNames = {
  SEED_DEMO: 'seedDemo',
  BUILD_BRIEFING_NOW: 'buildBriefingNow',
  DESCRIBE_WORK: 'describeWork',
  SAVE_ITEM: 'saveItem',
  UNSAVE_ITEM: 'unsaveItem',
} as const;

export const emulatorConfig = {
  HOST: 'localhost',
  AUTH_PORT: 9099,
  FIRESTORE_PORT: 8080,
  FUNCTIONS_PORT: 5001,
} as const;

export const placeholderApiKey = 'afterword-placeholder-api-key';
