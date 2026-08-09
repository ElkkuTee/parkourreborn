import { z } from 'zod';
import { limits } from '@/lib/reborn-ai/limits';
import type { AssistantBlock } from '@/lib/reborn-ai/types';
import type { CommunityResource } from '@/lib/pages/search';
import type { MovementEntry } from '@/lib/pages/techlist';
import type { TimeTrial, WorldRecord } from '@/lib/pages/timetrials';
import { wrVideoURL } from '@/lib/pages/timetrials';
import { formatTime } from '@/lib/pages/time';
import { cleanPathPart, cleanUrl } from '@/lib/url';

export type BlockContext = {
  techs: MovementEntry[];
  trials: TimeTrial[];
  records: WorldRecord[];
  resources: CommunityResource[];
  recipeText: string;
  seenUrls: Set<string>;
};

const allowedHosts = new Set([
  'parkourreborn.com',
  'www.parkourreborn.com',
  'parkourreborn.wiki',
  'wasans.tully.sh',
  'assets.wasans.tully.sh',
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'roblox.com',
  'www.roblox.com',
  'discord.gg',
]);

const short = z.string().trim().min(1).max(120);
const line = z.string().trim().min(1).max(600);
const url = z.string().trim().min(1).max(500);

export const blockInputSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), content: z.string().trim().min(1).max(1200) }),
  z.object({ type: z.literal('link'), title: short, url }),
  z.object({ type: z.literal('video'), url, title: short.optional() }),
  z.object({ type: z.literal('image'), url, alt: short.optional() }),
  z.object({ type: z.literal('gif'), url, title: short.optional() }),
  z.object({ type: z.literal('tech'), name: short }),
  z.object({ type: z.literal('time_trial'), name: short }),
  z.object({ type: z.literal('world_record'), trial: short }),
  z.object({
    type: z.literal('recipe'),
    item: short,
    items: z.array(z.object({ name: short, quantity: z.number().int().min(1).max(999) })).min(1).max(limits.maxRecipeItems),
    layout: z.array(line).max(6).optional(),
  }),
]);

export const showSchema = z.object({
  blocks: z.array(blockInputSchema).min(1).max(limits.maxBlocks),
});

export type BlockInput = z.infer<typeof blockInputSchema>;

const key = (value: string) => value.trim().toLowerCase();

function allowUrl(value: string, seen: Set<string>) {
  const clean = cleanUrl(value);
  if (!clean) return '';
  if (seen.has(clean)) return clean;
  if (clean.startsWith('/')) return clean;

  try {
    return allowedHosts.has(new URL(clean).hostname.toLowerCase()) ? clean : '';
  } catch {
    return '';
  }
}

function findTech(name: string, techs: MovementEntry[]) {
  const search = key(name);
  return techs.find((entry) => key(entry.name) === search)
    ?? techs.find((entry) => entry.aliases.some((alias) => key(alias) === search))
    ?? techs.find((entry) => key(entry.name).includes(search))
    ?? null;
}

function findTrial(name: string, trials: TimeTrial[]) {
  const search = key(name);
  return trials.find((trial) => key(trial.name) === search)
    ?? trials.find((trial) => key(trial.name).includes(search))
    ?? null;
}

function findRecord(name: string, records: WorldRecord[]) {
  const search = key(name);
  return records.find((record) => key(record.trialName) === search)
    ?? records.find((record) => key(record.trialName).includes(search))
    ?? null;
}

function verifyBlock(input: BlockInput, context: BlockContext): AssistantBlock | null {
  if (input.type === 'text') return { type: 'text', content: input.content };

  if (input.type === 'link' || input.type === 'video' || input.type === 'image' || input.type === 'gif') {
    const safe = allowUrl(input.url, context.seenUrls);
    if (!safe) return null;

    if (input.type === 'link') return { type: 'link', title: input.title, url: safe };
    if (input.type === 'image') return { type: 'image', url: safe, alt: input.alt };
    if (input.type === 'gif') return { type: 'gif', url: safe, title: input.title };
    return { type: 'video', url: safe, title: input.title };
  }

  if (input.type === 'tech') {
    const entry = findTech(input.name, context.techs);
    if (!entry) return null;

    return {
      type: 'tech',
      name: entry.name,
      kind: entry.kind,
      aliases: entry.aliases,
      steps: entry.steps,
      videoUrl: entry.videoUrl,
      tutorialUrl: entry.tutorialUrl,
    };
  }

  if (input.type === 'time_trial') {
    const trial = findTrial(input.name, context.trials);
    if (!trial) return null;

    return {
      type: 'time_trial',
      name: trial.name,
      district: trial.district,
      difficulty: trial.difficulty,
      bronze: formatTime(trial.bronzeTime),
      silver: formatTime(trial.silverTime),
      gold: formatTime(trial.goldTime),
      platinum: formatTime(trial.platinumTime),
      videoUrl: trial.videoURL,
    };
  }

  if (input.type === 'world_record') {
    const record = findRecord(input.trial, context.records);
    if (!record) return null;

    const id = cleanPathPart(record.submissionUuid);

    return {
      type: 'world_record',
      trial: record.trialName,
      player: record.playerName,
      time: formatTime(record.time),
      wasansScore: record.playerScore === null ? '' : record.playerScore.toFixed(3),
      submissionUrl: id ? `https://wasans.tully.sh/submissions/${id}` : '',
      videoUrl: wrVideoURL(record.submissionUuid),
    };
  }

  const known = (value: string) => context.recipeText.includes(key(value));
  if (!known(input.item) || !input.items.every((item) => known(item.name))) return null;

  return {
    type: 'recipe',
    item: input.item,
    items: input.items,
    layout: input.layout ?? [],
  };
}

export function verifyBlocks(inputs: BlockInput[], context: BlockContext) {
  const blocks: AssistantBlock[] = [];
  let dropped = 0;

  for (const input of inputs) {
    if (blocks.length >= limits.maxBlocks) break;
    const block = verifyBlock(input, context);
    if (block) blocks.push(block);
    else dropped += 1;
  }

  return { blocks, dropped };
}
