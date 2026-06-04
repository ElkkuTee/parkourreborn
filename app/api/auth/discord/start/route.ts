import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/server/firebase-admin';
import { verifyBearer } from '@/lib/server/auth';

const maxAge = 10 * 60;

const env = () => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  if (!clientId || !redirectUri) throw new Error('Discord env is missing');
  return {clientId, redirectUri};
};

export async function POST(request: NextRequest) {
  try {
    const token = await verifyBearer(request.headers.get('authorization'));
    const {clientId, redirectUri} = env();
    const state = randomBytes(32).toString('hex');
    const now = Date.now();

    await getAdminDb().collection('discordAuthStates').doc(state).set({
      uid: token.uid,
      createdAt: now,
      expiresAt: now + maxAge * 1000,
    });

    const url = new URL('https://discord.com/oauth2/authorize');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'identify email');
    url.searchParams.set('state', state);

    const response = NextResponse.json({url: url.toString()});
    response.cookies.set('discord_oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({error: 'Could not start Discord login'}, {status: 400});
  }
}
