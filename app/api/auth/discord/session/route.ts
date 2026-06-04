import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/server/firebase-admin';

export async function POST(request: NextRequest) {
  const login = request.cookies.get('discord_login')?.value;
  if (!login) return NextResponse.json({token: null});

  const db = getAdminDb();
  const ref = db.collection('discordLogins').doc(login);
  const doc = await ref.get();
  const data = doc.data() as {uid?: string; discordId?: string; expiresAt?: number} | undefined;

  const done = (token: string | null) => {
    const response = NextResponse.json({token});
    response.cookies.delete('discord_login');
    return response;
  };

  if (!doc.exists || !data?.uid || !data.discordId || !data.expiresAt || data.expiresAt < Date.now()) {
    await ref.delete().catch(() => {});
    return done(null);
  }

  const token = await getAdminAuth().createCustomToken(data.uid, {
    provider: 'discord',
    discordId: data.discordId,
  });

  await ref.delete();
  return done(token);
}
