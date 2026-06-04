import 'server-only';

import { getAdminAuth } from '@/lib/server/firebase-admin';

export async function verifyBearer(header: string | null) {
  const [type, token] = header?.split(' ') ?? [];
  if (type !== 'Bearer' || !token) throw new Error('Missing auth token');
  return getAdminAuth().verifyIdToken(token);
}
