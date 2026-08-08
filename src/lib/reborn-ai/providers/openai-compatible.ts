import 'server-only';

import { limits } from '@/lib/reborn-ai/limits';
import { ModelError } from '@/lib/reborn-ai/providers/types';
import type { ModelMessage, ModelTurn, Provider, ToolCall } from '@/lib/reborn-ai/providers/types';
import type { ToolDefinition } from '@/lib/reborn-ai/tools';

type Delta = {
  content?: string | null;
  tool_calls?: {
    index?: number;
    id?: string;
    function?: { name?: string; arguments?: string };
  }[];
};

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

function wait(ms: number, provider: string, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new ModelError('aborted', 0, provider));
    }, { once: true });
  });
}

function backoff(response: Response, attempt: number) {
  const header = Number(response.headers.get('retry-after'));
  if (Number.isFinite(header) && header > 0) return Math.min(header * 1000, 8000);
  return Math.min(800 * 2 ** attempt, 6000) + Math.floor(Math.random() * 300);
}

async function openStream(
  provider: Provider,
  messages: ModelMessage[],
  tools: ToolDefinition[],
  signal?: AbortSignal,
) {
  const body = JSON.stringify({
    model: provider.model(),
    messages,
    ...(tools.length ? { tools } : {}),
    stream: true,
    max_tokens: limits.maxOutputTokens,
    temperature: 0.6,
    ...provider.extras,
  });

  for (let attempt = 0; ; attempt += 1) {
    const deadline = AbortSignal.timeout(limits.modelTimeoutMs);

    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: provider.headers(),
      signal: signal ? AbortSignal.any([signal, deadline]) : deadline,
      body,
    });

    if (response.ok && response.body) return response;
    if (!retryable.has(response.status) || attempt >= limits.maxModelRetries) {
      throw new ModelError(`${provider.name} responded ${response.status}`, response.status, provider.name);
    }

    await wait(backoff(response, attempt), provider.name, signal);
  }
}

export async function streamCompletion(
  provider: Provider,
  messages: ModelMessage[],
  tools: ToolDefinition[],
  onText: (delta: string) => void,
  signal?: AbortSignal,
): Promise<ModelTurn> {
  const response = await openStream(provider, messages, tools, signal);
  if (!response.body) throw new ModelError('model sent no body', 0, provider.name);

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
