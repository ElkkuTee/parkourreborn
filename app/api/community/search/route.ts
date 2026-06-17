import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/server/firebase-admin';
import type { CommunityResource, CommunityResourceType } from '@/lib/pages/search';

type GifData = {
  link?: string;
};

type LinkData = {
  link?: string;
  description?: string;
};

type FileData = {
  link?: string;
  description?: string;
  downloadable?: boolean;
};

export const dynamic = 'force-dynamic';

const text = (value: unknown) => (value === undefined || value === null ? '' : String(value).trim());

async function getDocs<T>(name: string) {
  const snapshot = await getAdminDb().collection(name).get();
  return snapshot.docs.map((doc) => ({id: doc.id, data: doc.data() as T}));
}

function cleanResource(id: string, type: CommunityResourceType, data: GifData | LinkData | FileData): CommunityResource | null {
  const link = text(data.link);
  if (!id || !link) return null;

  const resource: CommunityResource = {
    id: `${type}:${id}`,
    name: id,
    type,
    link,
  };

  if ('description' in data) {
    const description = text(data.description);
    if (description) resource.description = description;
  }

  if (type === 'file' && 'downloadable' in data) resource.downloadable = data.downloadable === true;

  return resource;
}

const sortType = {gif: 0, file: 1, link: 2} satisfies Record<CommunityResourceType, number>;

export async function GET() {
  try {
    const [gifs, files, links] = await Promise.all([
      getDocs<GifData>('gifs'),
      getDocs<FileData>('files'),
      getDocs<LinkData>('links'),
    ]);

    const resources = [
      ...gifs.map((doc) => cleanResource(doc.id, 'gif', doc.data)),
      ...files.map((doc) => cleanResource(doc.id, 'file', doc.data)),
      ...links.map((doc) => cleanResource(doc.id, 'link', doc.data)),
    ]
      .filter((item): item is CommunityResource => Boolean(item))
      .sort((a, b) => sortType[a.type] - sortType[b.type] || a.name.localeCompare(b.name));

    return NextResponse.json(resources);
  } catch {
    return NextResponse.json({error: 'Community search unavailable'}, {status: 500});
  }
}
