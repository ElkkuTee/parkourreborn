import 'server-only';

import { groq } from '@/lib/reborn-ai/providers/groq';
import { streamCompletion } from '@/lib/reborn-ai/providers/openai-compatible';
import { openrouter } from '@/lib/reborn-ai/providers/openrouter';
import { ModelError } from '@/lib/reborn-ai/providers/types';
import type { ModelMessage, ModelTurn } from '@/lib/reborn-ai/providers/types';
import type { ToolDefinition } from '@/lib/reborn-ai/tools';

export { ModelError } from '@/lib/reborn-ai/providers/types';
export type { ModelMessage, ModelTurn, ToolCall } from '@/lib/reborn-ai/providers/types';

const chain = [groq, openrouter];

export function hasModelKey() {
  return chain.some((provider) => provider.ready());
}

export async function streamModel(
  messages: ModelMessage[],
  tools: ToolDefinition[],
  onText: (delta: string) => void,
  signal?: AbortSignal,
): Promise<ModelTurn> {
  const ready = chain.filter((provider) => provider.ready());
  if (!ready.length) throw new ModelError('no provider configured');

  let last: unknown;

  for (const provider of ready) {
    let spoke = false;

    const speak = (delta: string) => {
      spoke = true;
      onText(delta);
    };

    try {
      return await streamCompletion(provider, messages, tools, speak, signal);
    } catch (error) {
      last = error;
      if (spoke || signal?.aborted) throw error;
    }
  }

  throw last;
}
