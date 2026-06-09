import { NextRequest, NextResponse } from 'next/server';
import { getFragranceById, getFragrancePrices } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [fragrance, prices] = await Promise.all([
      getFragranceById(params.id),
      getFragrancePrices(params.id),
    ]);

    if (!fragrance) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ ...fragrance, listings: prices });
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
