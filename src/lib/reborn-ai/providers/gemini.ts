import 'server-only';

import { ModelError } from '@/lib/reborn-ai/providers/types';
import type { Provider } from '@/lib/reborn-ai/providers/types';

const model = 'gemini-3.6-flash';

export const gemini: Provider = {
  name: 'gemini',
  endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
  model: () => model,
  ready: () => Boolean(process.env.GEMINI_API_KEY?.trim()),

  headers() {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) throw new ModelError('missing key', 0, 'gemini');

    return {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    };
  },

  extras: { reasoning_effort: 'low' },
};
