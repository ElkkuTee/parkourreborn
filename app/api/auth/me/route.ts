import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/server/firebase-admin';
import { verifyBearer } from '@/lib/server/auth';

const stamp = (value: string | undefined) => {
  const time = value ? Date.parse(value) : NaN;
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
};

export async function GET(request: NextRequest) {
  try {
    const token = await verifyBearer(request.headers.get('authorization'));
    const [doc, user] = await Promise.all([
      getAdminDb().collection('users').doc(token.uid).get(),
      getAdminAuth().getUser(token.uid).catch(() => null),
    ]);

    return NextResponse.json({
      discord: doc.data()?.discord ?? null,
      account: {
        createdAt: stamp(user?.metadata.creationTime),
        lastLogin: stamp(user?.metadata.lastSignInTime),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = await verifyBearer(request.headers.get('authorization'));
    await getAdminDb().collection('users').doc(token.uid).set({
      discord: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
