import { NextRequest, NextResponse } from 'next/server';
import { searchFragrances } from '@/lib/db';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '20'), 50);

  try {
    const fragrances = await searchFragrances(q, limit);
    return NextResponse.json(fragrances);
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
