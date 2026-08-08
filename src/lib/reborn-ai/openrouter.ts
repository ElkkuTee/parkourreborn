import 'server-only';

import { limits } from '@/lib/reborn-ai/limits';
import type { ToolDefinition } from '@/lib/reborn-ai/tools';

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

type Delta = {
  content?: string | null;
  tool_calls?: {
    index?: number;
    id?: string;
    function?: { name?: string; arguments?: string };
  }[];
};

const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
const fallbackModel = 'openrouter/free';

export class ModelError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
  }
}

export function modelName() {
  return process.env.OPENROUTER_MODEL?.trim() || fallbackModel;
}

export function hasModelKey() {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

function headers() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new ModelError('missing key');

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.parkourreborn.com';

  return {
    'content-type': 'application/json',
    authorization: `Bearer ${apiKey}`,
    'HTTP-Referer': site,
    'X-Title': 'Parkour Reborn Hub',
  };
}

function mergeToolCalls(calls: ToolCall[], delta: Delta) {
  delta.tool_calls?.forEach((part, order) => {
    const index = part.index ?? order;
    const current = calls[index] ?? { id: '', type: 'function' as const, function: { name: '', arguments: '' } };

    calls[index] = {
      id: part.id ?? current.id,
      type: 'function',
      function: {
        name: part.function?.name ?? current.function.name,
        arguments: `${current.function.arguments}${part.function?.arguments ?? ''}`,
      },
    };
  });
}

const retryable = new Set([408, 409, 429, 500, 502, 503, 504]);

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new ModelError('aborted'));
    }, { once: true });
  });
}

function backoff(response: Response, attempt: number) {
  const header = Number(response.headers.get('retry-after'));
  if (Number.isFinite(header) && header > 0) return Math.min(header * 1000, 8000);
  return Math.min(800 * 2 ** attempt, 6000) + Math.floor(Math.random() * 300);
}

async function openStream(messages: ModelMessage[], tools: ToolDefinition[], signal?: AbortSignal) {
  const body = JSON.stringify({
    model: modelName(),
    messages,
    ...(tools.length ? { tools } : {}),
    stream: true,
    max_tokens: limits.maxOutputTokens,
    temperature: 0.6,
    reasoning: { effort: 'low', exclude: true },
  });

  for (let attempt = 0; ; attempt += 1) {
    const deadline = AbortSignal.timeout(limits.modelTimeoutMs);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers(),
      signal: signal ? AbortSignal.any([signal, deadline]) : deadline,
      body,
    });

    if (response.ok && response.body) return response;
    if (!retryable.has(response.status) || attempt >= limits.maxModelRetries) {
      throw new ModelError(`model responded ${response.status}`, response.status);
    }

    await wait(backoff(response, attempt), signal);
  }
}

export async function streamModel(
  messages: ModelMessage[],
  tools: ToolDefinition[],
  onText: (delta: string) => void,
  signal?: AbortSignal,
): Promise<ModelTurn> {
  const response = await openStream(messages, tools, signal);
  if (!response.body) throw new ModelError('model sent no body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const toolCalls: ToolCall[] = [];
  let content = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;

      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;

      let delta: Delta | undefined;
      try {
        delta = (JSON.parse(payload) as { choices?: { delta?: Delta }[] }).choices?.[0]?.delta;
      } catch {
        continue;
      }

      if (!delta) continue;
      if (delta.content) {
        content += delta.content;
        onText(delta.content);
      }
      if (delta.tool_calls) mergeToolCalls(toolCalls, delta);
    }
  }

  return { content, toolCalls: toolCalls.filter((call) => call.function.name) };
}
