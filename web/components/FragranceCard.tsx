import Link from 'next/link';
import Image from 'next/image';
import { TrendingDown } from 'lucide-react';
import type { Fragrance, TrackedProduct } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface FragranceCardProps {
  fragrance: Fragrance;
  cheapest?: TrackedProduct | null;
  className?: string;
}

export function FragranceCard({ fragrance, cheapest, className }: FragranceCardProps) {
  return (
    <Link
      href={`/fragrance/${fragrance.id}`}
      className={cn(
        'card group flex flex-col overflow-hidden',
        'hover:border-brand-300 dark:hover:border-brand-700',
        'hover:shadow-md transition-all duration-200',
        className
      )}
    >
      {/* Image */}
      <div className="relative bg-gray-50 dark:bg-gray-800/50 aspect-square overflow-hidden">
        {fragrance.image_url ? (
          <Image
            src={fragrance.image_url}
            alt={`${fragrance.brand} ${fragrance.name}`}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl select-none">🌸</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">
          {fragrance.brand}
        </p>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug line-clamp-2">
          {fragrance.name}
        </h3>

        {cheapest ? (
          <div className="mt-auto pt-2 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">From</p>
              <p className="text-base font-bold text-brand-600 dark:text-brand-400">
                {formatPrice(cheapest.last_price!, cheapest.currency)}
              </p>
            </div>
            <TrendingDown className="h-4 w-4 text-green-500" aria-label="Price available" />
          </div>
        ) : (
          <p className="mt-auto pt-2 text-xs text-gray-400 italic">No prices yet</p>
        )}
      </div>
    </Link>
  );
}
