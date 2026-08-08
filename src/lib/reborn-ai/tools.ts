import 'server-only';

import { z } from 'zod';
import { limits } from '@/lib/reborn-ai/limits';
import { showSchema, verifyBlocks } from '@/lib/reborn-ai/blocks';
import type { AssistantBlock } from '@/lib/reborn-ai/types';
import type { CommunityResource } from '@/lib/pages/search';
import type { MovementEntry } from '@/lib/pages/techlist';
import { searchTechs } from '@/lib/pages/techlist';
import type { TimeTrial, WorldRecord } from '@/lib/pages/timetrials';
import { wrVideoURL } from '@/lib/pages/timetrials';
import { formatTime } from '@/lib/pages/time';
import { cleanPathPart } from '@/lib/url';

export type ToolDefinition = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ToolOutcome = {
  content: string;
  blocks: AssistantBlock[];
};

type WrItem = {
  trial_name?: string;
  player_name?: string;
  time?: number;
  submission_uuid?: string;
  player_score?: number;
};

const stepNotation = 'Steps come back raw. A step ending in * is optional. A step ending in - or + is an advanced-mode toggle: with advanced mode on the - steps drop out and the + steps come in. Read the markers, do not show them raw to the user.';

const count = z.number().int().min(1).max(limits.maxToolResultItems).optional();
const term = z.string().trim().min(1).max(80);

const schemas = {
  search_techs: z.object({ query: term, kind: z.enum(['tech', 'concept', 'basic']).optional(), limit: count }),
  get_time_trials: z.object({ query: term.optional(), district: term.optional(), limit: count }),
  get_world_records: z.object({ trial: term.optional(), limit: count }),
  search_community: z.object({ query: term, type: z.enum(['gif', 'file', 'link']).optional(), limit: count }),
  show: showSchema,
};

export type ToolName = keyof typeof schemas;

const blockFields = {
  type: { type: 'string', enum: ['text', 'link', 'video', 'image', 'gif', 'tech', 'time_trial', 'world_record', 'recipe'] },
  content: { type: 'string', description: 'text blocks only' },
  title: { type: 'string', description: 'link, video and gif blocks' },
  url: { type: 'string', description: 'link, video, image and gif blocks. Must be a url you actually got from a tool' },
  alt: { type: 'string', description: 'image blocks only' },
  name: { type: 'string', description: 'tech and time_trial blocks: the exact name from the tool result' },
  trial: { type: 'string', description: 'world_record blocks: the exact trial name from the tool result' },
  item: { type: 'string', description: 'recipe blocks: what is being crafted' },
  items: {
    type: 'array',
    description: 'recipe blocks: the ingredients',
    items: {
      type: 'object',
      properties: { name: { type: 'string' }, quantity: { type: 'integer' } },
      required: ['name', 'quantity'],
    },
  },
  layout: { type: 'array', description: 'recipe blocks: optional crafting grid rows', items: { type: 'string' } },
};

export const toolDefinitions: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'search_techs',
      description: `Search the tech list for techs, concepts and basics. Matches names, aliases and steps. Use this for anything about how a specific movement is performed, what it is called, or what it chains from. ${stepNotation}`,
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'name, alias or partial name' },
          kind: { type: 'string', enum: ['tech', 'concept', 'basic'] },
          limit: { type: 'integer', minimum: 1, maximum: limits.maxToolResultItems },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_time_trials',
      description: 'Get time trials with their district, difficulty, medal times and route videos. This is the source of truth for medal times. Leave query empty to list trials.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'trial name or part of it' },
          district: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: limits.maxToolResultItems },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_world_records',
      description: 'Get current time trial world records: trial, player, time, Wasans score, submission page and video. Always use this for world record questions, never memory. Leave trial empty to get the newest records.',
      parameters: {
        type: 'object',
        properties: {
          trial: { type: 'string', description: 'trial name or part of it' },
          limit: { type: 'integer', minimum: 1, maximum: limits.maxToolResultItems },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_community',
      description: 'Search the community library for gifs, files and links. Use this when someone wants a gif, a document or a community link. Returns real urls you can pass to show.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          type: { type: 'string', enum: ['gif', 'file', 'link'] },
          limit: { type: 'integer', minimum: 1, maximum: limits.maxToolResultItems },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'show',
      description: `Rarely needed. Cards for techs, trials, records, gifs and links already attach on their own after a tool runs. Only call this for a crafting recipe card, or to pick specific cards when the automatic ones would be wrong. Never call it for plain chat. Max ${limits.maxBlocks} blocks.`,
      parameters: {
        type: 'object',
        properties: {
          blocks: {
            type: 'array',
            maxItems: limits.maxBlocks,
            items: { type: 'object', properties: blockFields, required: ['type'] },
          },
        },
        required: ['blocks'],
      },
    },
  },
];

const key = (value: string) => value.trim().toLowerCase();
const matches = (value: string, search: string) => key(value).includes(key(search));

export function createToolkit(origin: string, signal?: AbortSignal) {
  const seenUrls = new Set<string>();
  const blocks: AssistantBlock[] = [];
  const autoBlocks: AssistantBlock[] = [];
  const cache = new Map<string, Promise<unknown>>();

  const suggest = (found: number, make: () => AssistantBlock[]) => {
    if (found < 1 || found > 2 || autoBlocks.length >= limits.maxAutoBlocks) return;
    autoBlocks.push(...make().slice(0, limits.maxAutoBlocks - autoBlocks.length));
  };

  const track = (...urls: (string | undefined)[]) => {
    for (const url of urls) if (url) seenUrls.add(url);
  };

  async function load<T>(path: string, pick: (data: unknown) => T): Promise<T> {
    if (!cache.has(path)) {
      cache.set(path, (async () => {
        const deadline = AbortSignal.timeout(limits.toolTimeoutMs);

        const response = await fetch(`${origin}${path}`, {
          cache: 'no-store',
          signal: signal ? AbortSignal.any([signal, deadline]) : deadline,
        });
        if (!response.ok) throw new Error(`${path} failed`);
        return pick(await response.json());
      })().catch((error) => {
        cache.delete(path);
        throw error;
      }));
    }

    return cache.get(path) as Promise<T>;
  }

  const getTechs = () => load('/api/techs', (data) => (Array.isArray(data) ? data as MovementEntry[] : []));
  const getTrials = () => load('/api/timetrials', (data) => (Array.isArray(data) ? data as TimeTrial[] : []));
  const getResources = () => load('/api/community/search', (data) => (Array.isArray(data) ? data as CommunityResource[] : []));

  const getRecords = () => load('/api/wrs', (data) => {
    const items = (data as { results?: WrItem[] })?.results ?? [];

    return items
      .filter((item): item is WrItem & { trial_name: string; time: number } => Boolean(item.trial_name) && typeof item.time === 'number')
      .map<WorldRecord>((item) => ({
        trialName: item.trial_name,
        playerName: item.player_name ?? 'Unknown',
        time: item.time,
        submissionUuid: item.submission_uuid ?? '',
        playerScore: typeof item.player_score === 'number' ? item.player_score : null,
      }));
  });

  async function runTechs(args: z.infer<typeof schemas.search_techs>) {
    const entries = await getTechs();
    const results = searchTechs(entries, args.query, args.kind ?? 'all').slice(0, args.limit ?? 5);

    suggest(results.length, () => results.map(({ entry }) => ({
      type: 'tech',
      name: entry.name,
      kind: entry.kind,
      aliases: entry.aliases,
      steps: entry.steps,
      videoUrl: entry.videoUrl,
      tutorialUrl: entry.tutorialUrl,
    })));

    return results.map(({ entry }) => {
      track(entry.videoUrl, entry.tutorialUrl);

      return {
        name: entry.name,
        kind: entry.kind,
        aliases: entry.aliases,
        steps: entry.steps,
        videoUrl: entry.videoUrl,
        tutorialUrl: entry.tutorialUrl,
      };
    });
  }

  async function runTrials(args: z.infer<typeof schemas.get_time_trials>) {
    const trials = await getTrials();
    const found = trials
      .filter((trial) => (args.query ? matches(trial.name, args.query) : true))
      .filter((trial) => (args.district ? matches(trial.district, args.district) : true))
      .slice(0, args.limit ?? 6);

    suggest(found.length, () => found.map((trial) => ({
      type: 'time_trial',
      name: trial.name,
      district: trial.district,
      difficulty: trial.difficulty,
      bronze: formatTime(trial.bronzeTime),
      silver: formatTime(trial.silverTime),
      gold: formatTime(trial.goldTime),
      platinum: formatTime(trial.platinumTime),
      videoUrl: trial.videoURL,
    })));

    return found
      .map((trial) => {
        track(trial.videoURL, trial.videoURL2);

        return {
          name: trial.name,
          district: trial.district,
          difficulty: trial.difficulty,
          bronze: formatTime(trial.bronzeTime),
          silver: formatTime(trial.silverTime),
          gold: formatTime(trial.goldTime),
          platinum: formatTime(trial.platinumTime),
          videoUrl: trial.videoURL,
          videoUrl2: trial.videoURL2,
        };
      });
  }

  async function runRecords(args: z.infer<typeof schemas.get_world_records>) {
    const records = await getRecords();
    const found = records
      .filter((record) => (args.trial ? matches(record.trialName, args.trial) : true))
      .slice(0, args.limit ?? 6);

    suggest(found.length, () => found.map((record) => ({
      type: 'world_record',
      trial: record.trialName,
      player: record.playerName,
      time: formatTime(record.time),
      wasansScore: record.playerScore === null ? '' : record.playerScore.toFixed(3),
      submissionUrl: cleanPathPart(record.submissionUuid) ? `https://wasans.tully.sh/submissions/${cleanPathPart(record.submissionUuid)}` : '',
      videoUrl: wrVideoURL(record.submissionUuid),
    })));

    return found
      .map((record) => {
        const id = cleanPathPart(record.submissionUuid);
        const submissionUrl = id ? `https://wasans.tully.sh/submissions/${id}` : '';
        const videoUrl = wrVideoURL(record.submissionUuid);
        track(submissionUrl, videoUrl);

        return {
          trial: record.trialName,
          player: record.playerName,
          time: formatTime(record.time),
          wasansScore: record.playerScore === null ? null : record.playerScore.toFixed(3),
          submissionUuid: record.submissionUuid,
          submissionUrl,
          videoUrl,
        };
      });
  }

  async function runCommunity(args: z.infer<typeof schemas.search_community>) {
    const resources = await getResources();
    const found = resources
      .filter((item) => (args.type ? item.type === args.type : true))
      .filter((item) => matches(item.name, args.query) || matches(item.description ?? '', args.query))
      .slice(0, args.limit ?? 6);

    suggest(found.length, () => found.map((item) => (item.type === 'gif'
      ? { type: 'gif' as const, url: item.link, title: item.name }
      : { type: 'link' as const, title: item.name, url: item.link })));

    return found
      .map((item) => {
        track(item.link, item.redirect);

        return {
          name: item.name,
          type: item.type,
          url: item.link,
          openUrl: item.redirect ?? item.link,
          description: item.description ?? '',
        };
      });
  }

  async function runShow(args: z.infer<typeof schemas.show>) {
    const [techs, trials, records, resources] = await Promise.all([
      getTechs().catch(() => [] as MovementEntry[]),
      getTrials().catch(() => [] as TimeTrial[]),
      getRecords().catch(() => [] as WorldRecord[]),
      getResources().catch(() => [] as CommunityResource[]),
    ]);

    const room = limits.maxBlocks - blocks.length;
    if (room <= 0) return { shown: 0, dropped: args.blocks.length, note: 'block limit reached' };

    const verified = verifyBlocks(args.blocks.slice(0, room), { techs, trials, records, resources, seenUrls });
    blocks.push(...verified.blocks);

    return {
      shown: verified.blocks.length,
      dropped: verified.dropped,
      note: verified.dropped ? 'dropped blocks did not match real data, do not retry them' : '',
    };
  }

  async function execute(name: string, args: unknown) {
    if (name === 'search_techs') return runTechs(schemas.search_techs.parse(args));
    if (name === 'get_time_trials') return runTrials(schemas.get_time_trials.parse(args));
    if (name === 'get_world_records') return runRecords(schemas.get_world_records.parse(args));
    if (name === 'search_community') return runCommunity(schemas.search_community.parse(args));
    if (name === 'show') return runShow(schemas.show.parse(args));
    throw new Error('unknown tool');
  }

  return {
    blocks,
    autoBlocks,
    seenUrls,
    trackKnowledgeUrls(text: string) {
      for (const match of text.matchAll(/https?:\/\/[^\s)>\]]+/g)) seenUrls.add(match[0]);
    },
    async run(name: string, raw: string): Promise<string> {
      let args: unknown;

      try {
        args = raw.trim() ? JSON.parse(raw) : {};
      } catch {
        return JSON.stringify({ error: 'arguments were not valid json' });
      }

      try {
        return JSON.stringify({ result: await execute(name, args) });
      } catch (error) {
        if (error instanceof z.ZodError) return JSON.stringify({ error: 'arguments did not match the tool schema' });
        return JSON.stringify({ error: `${name} is unavailable right now` });
      }
    },
  };
}

export type Toolkit = ReturnType<typeof createToolkit>;
