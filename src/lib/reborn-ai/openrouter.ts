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

// OPENROUTER_MODELS takes a comma separated list. The first one is the pick, the rest
// are what openrouter falls back to when a free model is queued or throws a 429.
export function modelNames() {
  const raw = process.env.OPENROUTER_MODELS?.trim() || process.env.OPENROUTER_MODEL?.trim() || '';
  const names = raw.split(',').map((name) => name.trim()).filter(Boolean);
  return names.length ? names : [fallbackModel];
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
    if (signal?.aborted) {
      reject(new ModelError('aborted'));
      return;
    }

    const clean = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', bail);
    };

    const bail = () => {
      clean();
      reject(new ModelError('aborted'));
    };

    const timer = setTimeout(() => {
      clean();
      resolve();
    }, ms);

    signal?.addEventListener('abort', bail, { once: true });
  });
}

function backoff(attempt: number, retryAfter?: string | null) {
  const header = Number(retryAfter);
  if (Number.isFinite(header) && header > 0) return Math.min(header * 1000, 15000);
  return Math.min(800 * 2 ** attempt, 6000) + Math.floor(Math.random() * 300);
}

// The model is allowed to take as long as it likes, it just has to keep talking.
// Anything that goes quiet for modelIdleMs is dead, and a healthy slow stream is never cut off.
function watchdog(span: number, signal?: AbortSignal) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clear = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const relay = () => {
    clear();
    controller.abort(signal?.reason);
  };

  const bump = (next: number) => {
    clear();
    timer = setTimeout(() => controller.abort(new ModelError('model went quiet')), next);
  };

  const stop = () => {
    clear();
    signal?.removeEventListener('abort', relay);
  };

  if (signal?.aborted) relay();
  else signal?.addEventListener('abort', relay, { once: true });

  bump(span);
  return { signal: controller.signal, bump, stop };
}

function asModelError(error: unknown) {
  if (error instanceof ModelError) return error;
  return new ModelError(error instanceof Error ? error.message : 'model call failed');
}

async function openStream(messages: ModelMessage[], tools: ToolDefinition[], signal?: AbortSignal) {
  const names = modelNames();
  const auth = headers();

  const body = JSON.stringify({
    model: names[0],
    ...(names.length > 1 ? { models: names } : {}),
    messages,
    ...(tools.length ? { tools } : {}),
    stream: true,
    max_tokens: limits.maxOutputTokens,
    temperature: 0.6,
    reasoning: { effort: 'low', exclude: true },
    provider: { sort: 'throughput' },
  });

  for (let attempt = 0; ; attempt += 1) {
    const watch = watchdog(limits.modelConnectMs, signal);
    let response: Response;

    try {
      response = await fetch(endpoint, { method: 'POST', headers: auth, signal: watch.signal, body });
    } catch (error) {
      watch.stop();
      if (signal?.aborted || attempt >= limits.maxModelRetries) throw asModelError(error);
      await wait(backoff(attempt), signal);
      continue;
    }

    if (response.ok && response.body) {
      watch.bump(limits.modelIdleMs);
      return { response, body: response.body, watch };
    }

    watch.stop();
    await response.body?.cancel().catch(() => {});

    if (!retryable.has(response.status) || attempt >= limits.maxModelRetries) {
      throw new ModelError(`model responded ${response.status}`, response.status);
    }

    await wait(backoff(attempt, response.headers.get('retry-after')), signal);
  }
}

export async function streamModel(
  messages: ModelMessage[],
  tools: ToolDefinition[],
  onText: (delta: string) => void,
  signal?: AbortSignal,
): Promise<ModelTurn> {
  const { body, watch } = await openStream(messages, tools, signal);
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const toolCalls: ToolCall[] = [];
  let content = '';
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      watch.bump(limits.modelIdleMs);
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
  } catch (error) {
    throw asModelError(error);
  } finally {
    watch.stop();
  }

  return { content, toolCalls: toolCalls.filter((call) => call.function.name) };
}
