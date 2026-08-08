import 'server-only';

import { z } from 'zod';
import { formatKnowledge, knowledgeRetriever } from '@/lib/reborn-ai/knowledge-retriever';
import { limits } from '@/lib/reborn-ai/limits';
import { ModelError, streamModel } from '@/lib/reborn-ai/openrouter';
import type { ModelMessage } from '@/lib/reborn-ai/openrouter';
import { buildSystemPrompt } from '@/lib/reborn-ai/prompt';
import { extractFinal } from '@/lib/reborn-ai/text';
import { createToolkit, toolDefinitions } from '@/lib/reborn-ai/tools';
import type { ChatEvent, ChatMessage } from '@/lib/reborn-ai/types';

export const chatRequestSchema = z.object({
  messages: z
    .array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().trim().min(1).max(limits.maxMessageChars),
    }))
    .min(1)
    .max(limits.maxHistory * 2),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

type Emit = (event: ChatEvent) => void;

const fallbackReply = 'my brain glitched there, ask me again';

function modelErrorText(error: unknown) {
  if (!(error instanceof ModelError)) return fallbackReply;
  if (error.status === 429) return 'too many people asking at once, give it a sec';
  if (error.status >= 500) return 'the model is having a moment, try again';
  return 'reborn ai is not reachable right now';
}

function recentHistory(messages: ChatMessage[]) {
  const window = messages.slice(-limits.maxHistory);
  const start = window.findIndex((message) => message.role === 'user');
  return start === -1 ? [] : window.slice(start);
}

export async function runConversation(request: ChatRequest, origin: string, emit: Emit, signal?: AbortSignal) {
  const history = recentHistory(request.messages);
  const question = history[history.length - 1];

  if (!question || question.role !== 'user') {
    emit({ type: 'error', message: 'that message did not come through' });
    return;
  }

  emit({ type: 'status', state: 'looking' });

  const toolkit = createToolkit(origin, signal);
  const found = await knowledgeRetriever.search(question.content).catch(() => []);
  const knowledge = formatKnowledge(found);
  toolkit.trackKnowledgeUrls(knowledge);

  const messages: ModelMessage[] = [
    { role: 'system', content: buildSystemPrompt(knowledge) },
    ...history.map((message) => ({ role: message.role, content: message.content } as ModelMessage)),
  ];

  emit({ type: 'status', state: 'thinking' });

  let wrote = false;

  let rounds = 0;
  let retries = 0;

  const runTurn = async (available: typeof toolDefinitions) => {
    let streamed = '';
    let shown = '';

    const turn = await streamModel(messages, available, (chunk) => {
      streamed += chunk;
      const next = extractFinal(streamed);
      if (next === shown) return;

      if (!next.startsWith(shown)) {
        emit({ type: 'reset' });
        shown = '';
        wrote = false;
      }

      const delta = next.slice(shown.length);
      if (!delta) return;

      if (!shown) emit({ type: 'status', state: 'writing' });
      shown = next;
      wrote = true;
      emit({ type: 'text', delta });
    }, signal);

    return { turn, shown };
  };

  try {
    while (rounds < limits.maxToolRounds) {
      rounds += 1;
      const { turn, shown } = await runTurn(toolDefinitions);
      const roundText = shown;

      const calls = turn.toolCalls.slice(0, limits.maxToolCallsPerRound);

      if (!calls.length) {
        if (wrote || retries >= limits.maxEmptyRetries) break;
        retries += 1;
        rounds -= 1;
        continue;
      }

      const onlyShow = calls.every((call) => call.function.name === 'show');
      if (onlyShow && roundText.trim()) {
        for (const call of calls) await toolkit.run(call.function.name, call.function.arguments);
        break;
      }

      if (roundText) {
        emit({ type: 'reset' });
        wrote = false;
      }

      emit({ type: 'status', state: 'looking' });
      messages.push({ role: 'assistant', content: extractFinal(turn.content), tool_calls: calls });

      for (const call of calls) {
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          name: call.function.name,
          content: await toolkit.run(call.function.name, call.function.arguments),
        });
      }

      emit({ type: 'status', state: 'thinking' });
    }

    if (!wrote) {
      emit({ type: 'status', state: 'writing' });
      await runTurn([]);
    }
  } catch (error) {
    if (wrote) {
      emit({ type: 'done' });
      return;
    }

    emit({ type: 'error', message: modelErrorText(error) });
    return;
  }

  const blocks = toolkit.blocks.length ? toolkit.blocks : toolkit.autoBlocks;

  if (!wrote && !blocks.length) emit({ type: 'text', delta: fallbackReply });
  if (blocks.length) emit({ type: 'blocks', blocks });
  emit({ type: 'done' });
}
