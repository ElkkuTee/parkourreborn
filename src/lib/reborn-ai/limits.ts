export const limits = {
  maxBodyBytes: 64 * 1024,
  maxHistory: 10,
  maxMessageChars: 1400,
  maxToolRounds: 14,
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
  turnBudgetMs: 280000,
  wrapUpMs: 45000,
  modelConnectMs: 30000,
  modelIdleMs: 45000,
  heartbeatMs: 10000,
  dataCacheMs: 60000,
} as const;

export const rateLimits = {
  perMinute: 8,
  perHour: 60,
} as const;
