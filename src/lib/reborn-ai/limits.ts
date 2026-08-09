export const limits = {
  maxBodyBytes: 64 * 1024,
  maxHistory: 10,
  maxMessageChars: 1400,
  maxToolRounds: 9,
  maxEmptyRetries: 2,
  maxModelRetries: 3,
  maxToolCallsPerRound: 6,
  maxKnowledgeDocs: 8,
  maxKnowledgeChars: 26000,
  maxToolResultItems: 25,
  maxOutputTokens: 12000,
  maxAutoBlocks: 9,
  maxBlocks: 9,
  toolTimeoutMs: 12000,
  modelTimeoutMs: 60000,
} as const;

export const rateLimits = {
  perMinute: 8,
  perHour: 60,
} as const;
