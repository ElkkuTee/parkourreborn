export const limits = {
  maxBodyBytes: 64 * 1024,
  maxHistory: 10,
  maxMessageChars: 1400,
  maxToolRounds: 6,
  maxEmptyRetries: 2,
  maxModelRetries: 3,
  maxToolCallsPerRound: 4,
  maxKnowledgeDocs: 6,
  maxKnowledgeChars: 16000,
  maxToolResultItems: 8,
  maxOutputTokens: 6000,
  maxAutoBlocks: 3,
  maxBlocks: 6,
  maxRecipeItems: 12,
  toolTimeoutMs: 8000,
  modelTimeoutMs: 60000,
} as const;

export const rateLimits = {
  perMinute: 10,
  perHour: 120,
} as const;
