import Link from 'next/link';
import Image from 'next/image';
import type { Fragrance, TrackedProduct } from '@/lib/types';
import { formatPrice, formatSize } from '@/lib/utils';

interface Props {
  fragrance: Fragrance;
  cheapest: TrackedProduct | null;
  storeCount: number;
  allPrices: TrackedProduct[];
}

function isGoodDeal(cheapest: TrackedProduct | null, all: TrackedProduct[]): boolean {
  if (!cheapest?.last_price || all.length < 2) return false;
  const avg = all.reduce((s, p) => s + (p.last_price ?? 0), 0) / all.length;
  return cheapest.last_price < avg * 0.88;
}

export function FragranceListItem({ fragrance, cheapest, storeCount, allPrices }: Props) {
  const goodDeal = isGoodDeal(cheapest, allPrices);
  const pricePml =
    cheapest?.last_price && cheapest?.size_ml
      ? (cheapest.last_price / cheapest.size_ml).toFixed(2)
      : null;

  return (
    <Link
      href={`/fragrance/${fragrance.id}`}
      className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-4 py-4 hover:border-brand-400 hover:shadow-sm transition-all duration-150"
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center border border-gray-100">
        {fragrance.image_url ? (
          <Image
            src={fragrance.image_url}
            alt={`${fragrance.brand} ${fragrance.name}`}
            width={64}
            height={64}
            className="object-contain p-1"
          />
        ) : (
          <span className="text-2xl select-none">🌸</span>
        )}
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{fragrance.brand}</p>
        <p className="font-semibold text-gray-900 truncate">{fragrance.name}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {cheapest?.size_ml && (
            <span className="text-xs text-gray-500">{formatSize(cheapest.size_ml)}</span>
          )}
          {goodDeal && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-brand-600 text-white">
              GOOD DEAL
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="flex-shrink-0 text-right">
        {cheapest?.last_price ? (
          <>
            <p className="text-lg font-bold text-gray-900">
              {formatPrice(cheapest.last_price, cheapest.currency)}
            </p>
            {pricePml && (
              <p className="text-xs text-gray-400">${pricePml}/ml</p>
            )}
            {storeCount > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">{storeCount} {storeCount === 1 ? 'store' : 'stores'}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400 italic">No prices</p>
        )}
      </div>
    </Link>
  );
}
