import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/server/firebase-admin';
import { verifyBearer } from '@/lib/server/auth';

export async function GET(request: NextRequest) {
  try {
    const token = await verifyBearer(request.headers.get('authorization'));
    const doc = await getAdminDb().collection('users').doc(token.uid).get();
    const data = doc.data();
    return NextResponse.json({ discord: data?.discord ?? null });
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
