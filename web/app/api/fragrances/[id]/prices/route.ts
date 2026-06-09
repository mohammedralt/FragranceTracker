import { NextRequest, NextResponse } from 'next/server';
import { getAllPriceHistoryForFragrance } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const days = Math.min(parseInt(req.nextUrl.searchParams.get('days') ?? '90'), 365);

  try {
    const history = await getAllPriceHistoryForFragrance(params.id, days);
    return NextResponse.json(history);
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
