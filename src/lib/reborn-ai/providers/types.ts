import 'server-only';

export type ToolCall = {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
};

export type ModelMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string; tool_calls?: ToolCall[] }
  | { role: 'tool'; tool_call_id: string; name: string; content: string };

export type ModelTurn = {
  content: string;
  toolCalls: ToolCall[];
};

export type Provider = {
  name: string;
  endpoint: string;
  model: () => string;
  ready: () => boolean;
  headers: () => Record<string, string>;
  extras?: Record<string, unknown>;
};

export class ModelError extends Error {
  status: number;
  provider: string;

  constructor(message: string, status = 0, provider = '') {
    super(message);
    this.status = status;
    this.provider = provider;
  }
}
