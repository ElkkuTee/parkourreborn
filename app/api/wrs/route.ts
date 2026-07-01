import { NextResponse } from 'next/server';

const wrsURL = 'https://wasans.tully.sh/v1/records/world';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await fetch(wrsURL, {cache: 'no-store'});

    if (!response.ok) {
      return NextResponse.json({results: []}, {status: response.status});
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({results: []}, {status: 502});
  }
}
