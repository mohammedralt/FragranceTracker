import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Clock, CheckCircle, XCircle } from 'lucide-react';
import {
  getFragranceById,
  getFragrancePrices,
  getAllPriceHistoryForFragrance,
  isWatching,
} from '@/lib/db';
import { auth } from '@/lib/auth';
import { PriceHistoryChart } from '@/components/PriceHistoryChart';
import { WatchlistButton } from '@/components/WatchlistButton';
import { formatPrice, formatDate, timeAgo, formatSize } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const fragrance = await getFragranceById(params.id);
  if (!fragrance) return { title: 'Fragrance not found' };
  return {
    title: `${fragrance.brand} ${fragrance.name} — Price Comparison`,
    description: `Compare prices for ${fragrance.brand} ${fragrance.name} across FragranceNet, Jomashop, MaxAroma and more.`,
  };
}

export default async function FragrancePage({ params }: PageProps) {
  const [fragrance, prices, session] = await Promise.all([
    getFragranceById(params.id),
    getFragrancePrices(params.id),
    auth(),
  ]);

  if (!fragrance) notFound();

  const history = await getAllPriceHistoryForFragrance(fragrance.id, 90);

  const userId = session?.user?.id as string | undefined;
  const watching = userId ? await isWatching(userId, fragrance.id) : false;

  const cheapest = prices[0] ?? null;
  const inStockPrices = prices.filter((p) => p.last_in_stock);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/search" className="hover:text-gray-600">Fragrances</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700 dark:text-gray-300">{fragrance.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Image */}
        <div className="card flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 aspect-square lg:aspect-auto lg:min-h-72 p-8">
          {fragrance.image_url ? (
            <Image
              src={fragrance.image_url}
              alt={`${fragrance.brand} ${fragrance.name}`}
              width={300}
              height={300}
              className="object-contain max-h-64"
            />
          ) : (
            <span className="text-7xl select-none">🌸</span>
          )}
        </div>

        {/* Meta */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div>
            <p className="text-sm text-brand-600 dark:text-brand-400 font-medium uppercase tracking-wide mb-1">
              {fragrance.brand}
            </p>
            <h1 className="text-3xl font-bold mb-2">{fragrance.name}</h1>
            {fragrance.fragrance_type && (
              <span className="badge badge-purple">{fragrance.fragrance_type}</span>
            )}
          </div>

          {cheapest && (
            <div className="card p-4 border-brand-200 dark:border-brand-800/50 bg-brand-50/50 dark:bg-brand-950/30">
              <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mb-0.5">Best price</p>
              <p className="text-3xl font-bold text-brand-700 dark:text-brand-300">
                {formatPrice(cheapest.last_price!, cheapest.currency)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                at {cheapest.retailer_name}
                {cheapest.size_ml && ` · ${formatSize(cheapest.size_ml)}`}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-2">
            <WatchlistButton
              fragranceId={fragrance.id}
              isWatching={watching}
              isLoggedIn={!!session}
            />
            {cheapest && (
              <a
                href={cheapest.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                <ExternalLink className="h-4 w-4" />
                Go to {cheapest.retailer_name}
              </a>
            )}
          </div>

          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Prices updated every 12 hours
            {cheapest?.last_scraped_at && ` · Last checked ${timeAgo(cheapest.last_scraped_at)}`}
          </p>
        </div>
      </div>

      {/* Price comparison table */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">Price comparison</h2>

        {prices.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">
            No prices tracked yet for this fragrance.
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Retailer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Size</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Price</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">In stock</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Updated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {prices.map((p, i) => (
                  <tr
                    key={p.id}
                    className={cn(
                      'hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors',
                      i === 0 && 'bg-brand-50/30 dark:bg-brand-950/20'
                    )}
                  >
                    <td className="px-4 py-3 font-medium">
                      {p.retailer_name}
                      {i === 0 && (
                        <span className="ml-2 badge badge-green">Best</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.size_ml ? formatSize(p.size_ml) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">
                      {formatPrice(p.last_price!, p.currency)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.last_in_stock ? (
                        <CheckCircle className="h-4 w-4 text-green-500 inline-block" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400 inline-block" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs hidden sm:table-cell">
                      {p.last_scraped_at ? timeAgo(p.last_scraped_at) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={p.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1 text-xs"
                      >
                        View
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Price history chart */}
      <section>
        <h2 className="text-xl font-bold mb-4">Price history (90 days)</h2>
        <div className="card p-4">
          <PriceHistoryChart data={history} />
        </div>
      </section>
    </div>
  );
}
