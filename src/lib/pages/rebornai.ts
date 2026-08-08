import type { AssistantBlock, ChatEvent, ChatMessage } from '@/lib/reborn-ai/types';

export type ChatEntry = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  blocks: AssistantBlock[];
  at: number;
};

const errors: Record<number, string> = {
  400: 'that message did not go through',
  413: 'that message is way too long',
  429: 'you are going too fast, give it a minute',
  503: 'reborn ai is not set up yet',
};

let counter = 0;

export function newEntry(role: ChatEntry['role'], content: string): ChatEntry {
  counter += 1;
  const at = Date.now();
  return { id: `${role}-${at}-${counter}`, role, content, blocks: [], at };
}

export const chatTime = (at: number) => new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export function toHistory(entries: ChatEntry[]): ChatMessage[] {
  return entries
    .filter((entry) => entry.content.trim())
    .map((entry) => ({ role: entry.role, content: entry.content.trim() }));
}

export async function streamRebornAi(messages: ChatMessage[], signal: AbortSignal, onEvent: (event: ChatEvent) => void) {
  const response = await fetch('/api/reborn-ai/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!response.ok || !response.body) {
    onEvent({ type: 'error', message: errors[response.status] ?? 'reborn ai is unavailable right now' });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const flush = (chunk: string) => {
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data:')) continue;

      try {
        onEvent(JSON.parse(line.slice(5).trim()) as ChatEvent);
      } catch {}
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() ?? '';
    for (const chunk of chunks) flush(chunk);
  }

  if (buffer.trim()) flush(buffer);
}
