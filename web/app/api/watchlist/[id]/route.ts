import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { removeFromWatchlist } from '@/lib/db';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await removeFromWatchlist(session.user.id as string, params.id);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
