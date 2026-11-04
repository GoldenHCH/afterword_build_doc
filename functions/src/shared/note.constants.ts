export const noteKinds = {
  WORKING_ON: 'working_on',
  STUCK: 'stuck',
  QUESTION: 'question',
} as const;

export const noteStatuses = {
  OPEN: 'open',
  RESOLVED: 'resolved',
} as const;

export const noteSources = {
  MCP: 'mcp',
  APP: 'app',
} as const;
