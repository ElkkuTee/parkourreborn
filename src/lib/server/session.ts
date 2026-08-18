import 'server-only';

import type { DecodedIdToken } from 'firebase-admin/auth';
import type { NextRequest } from 'next/server';
import { getAdminAuth } from '@/lib/server/firebase-admin';

export type Session = {
  uid: string;
  discordId: string;
  name: string;
};

export const sessionCookie = 'discord_session';
export const sessionMaxAge = 14 * 24 * 60 * 60;

const idFromUid = (uid: string) => uid.replace(/^discord-/, '');

function toSession(token: DecodedIdToken): Session | null {
  const raw = typeof token.discordId === 'string' ? token.discordId : idFromUid(token.uid);
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(raw)) return null;

  return {
    uid: token.uid,
    discordId: raw,
    name: typeof token.name === 'string' ? token.name.slice(0, 64) : '',
  };
}

async function fromCookie(cookie: string) {
  try {
    return toSession(await getAdminAuth().verifySessionCookie(cookie));
  } catch {
    return null;
  }
}

async function fromHeader(header: string | null) {
  const [type, token] = header?.split(' ') ?? [];
  if (type !== 'Bearer' || !token) return null;

  try {
    return toSession(await getAdminAuth().verifyIdToken(token));
  } catch {
    return null;
  }
}

export async function readSession(request: NextRequest) {
  const cookie = request.cookies.get(sessionCookie)?.value;
  const session = cookie ? await fromCookie(cookie) : null;
  return session ?? fromHeader(request.headers.get('authorization'));
}
