import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { addToWatchlist, getUserWatchlist } from '@/lib/db';

const addSchema = z.object({
  fragrance_id: z.string().uuid(),
  alert_threshold: z.number().positive().nullable().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const items = await getUserWatchlist(session.user.id as string);
    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const item = await addToWatchlist(
      session.user.id as string,
      parsed.data.fragrance_id,
      parsed.data.alert_threshold ?? null
    );
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
