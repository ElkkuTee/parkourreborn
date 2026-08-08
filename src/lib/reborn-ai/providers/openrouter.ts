import 'server-only';

import { ModelError } from '@/lib/reborn-ai/providers/types';
import type { Provider } from '@/lib/reborn-ai/providers/types';

const fallbackModel = 'openrouter/free';

export const openrouter: Provider = {
  name: 'openrouter',
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  model: () => process.env.OPENROUTER_MODEL?.trim() || fallbackModel,
  ready: () => Boolean(process.env.OPENROUTER_API_KEY?.trim()),

  headers() {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) throw new ModelError('missing key', 0, 'openrouter');

    const site = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://www.parkourreborn.com';

    return {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': site,
      'X-Title': 'Parkour Reborn Hub',
    };
  },

  extras: { reasoning: { effort: 'low', exclude: true } },
};
