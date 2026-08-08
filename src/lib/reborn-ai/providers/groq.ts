import 'server-only';

import { ModelError } from '@/lib/reborn-ai/providers/types';
import type { Provider } from '@/lib/reborn-ai/providers/types';

const model = 'openai/gpt-oss-120b';

export const groq: Provider = {
  name: 'groq',
  endpoint: 'https://api.groq.com/openai/v1/chat/completions',
  model: () => model,
  ready: () => Boolean(process.env.GROQ_API_KEY?.trim()),

  headers() {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) throw new ModelError('missing key', 0, 'groq');

    return {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    };
  },

  extras: { reasoning_effort: 'low', include_reasoning: false },
};
