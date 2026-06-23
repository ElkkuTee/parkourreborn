import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/server/firebase-admin';
import type { MovementEntry, MovementKind } from '@/lib/pages/techlist';

type MovementData = {
  Aliases?: unknown;
  Kind?: unknown;
  Steps?: unknown;
  VideoUrl?: unknown;
  TutorialUrl?: unknown;
};

export const runtime = 'nodejs';

const kinds = new Set<MovementKind>(['tech', 'concept', 'basic']);
const text = (value: unknown) => (value === undefined || value === null ? '' : String(value).trim());
const list = (value: unknown) => Array.isArray(value) ? value.map(text).filter(Boolean) : [];

function cleanKind(value: unknown): MovementKind {
  const kind = text(value).toLowerCase() as MovementKind;
  return kinds.has(kind) ? kind : 'tech';
}

function cleanEntry(id: string, data: MovementData): MovementEntry {
  return {
    name: id,
    kind: cleanKind(data.Kind),
    aliases: list(data.Aliases),
    steps: list(data.Steps),
    videoUrl: text(data.VideoUrl),
    tutorialUrl: text(data.TutorialUrl),
  };
}

export async function GET() {
  try {
    const snapshot = await getAdminDb().collection('movement').get();
    const techs = snapshot.docs
      .map((doc) => cleanEntry(doc.id, doc.data() as MovementData))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(techs);
  } catch {
    return NextResponse.json({error: 'Tech list unavailable'}, {status: 500});
  }
}
