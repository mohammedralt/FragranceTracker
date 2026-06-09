'use client';

import { useState, useTransition } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WatchlistButtonProps {
  fragranceId: string;
  isWatching: boolean;
  watchlistItemId?: string;
  isLoggedIn: boolean;
}

export function WatchlistButton({
  fragranceId,
  isWatching: initialWatching,
  watchlistItemId,
  isLoggedIn,
}: WatchlistButtonProps) {
  const [watching, setWatching] = useState(initialWatching);
  const [itemId, setItemId] = useState(watchlistItemId);
  const [isPending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <a href="/login" className="btn-ghost">
        <Bell className="h-4 w-4" />
        Sign in to track
      </a>
    );
  }

  async function toggle() {
    startTransition(async () => {
      if (watching && itemId) {
        await fetch(`/api/watchlist/${itemId}`, { method: 'DELETE' });
        setWatching(false);
        setItemId(undefined);
      } else {
        const res = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fragrance_id: fragranceId }),
        });
        if (res.ok) {
          const data = await res.json();
          setWatching(true);
          setItemId(data.id);
        }
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={cn(
        'btn-primary gap-2',
        watching && 'bg-green-600 hover:bg-green-700'
      )}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : watching ? (
        <BellOff className="h-4 w-4" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      {watching ? 'Watching' : 'Track price'}
    </button>
  );
}
