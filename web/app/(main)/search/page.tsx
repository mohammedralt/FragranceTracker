import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Search } from 'lucide-react';
import { searchFragrances, getFragrancePrices, countFragrances } from '@/lib/db';
import { FragranceListItem } from '@/components/FragranceListItem';

interface SearchPageProps {
  searchParams: { q?: string; inStock?: string; sort?: string };
}

export function generateMetadata({ searchParams }: SearchPageProps): Metadata {
  const q = searchParams.q ?? '';
  return { title: q ? `"${q}" — Fragrance prices` : 'Browse fragrances' };
}

async function Results({ query, inStock, sort }: { query: string; inStock: boolean; sort: string }) {
  let total = 0;
  try {
    total = await countFragrances();
  } catch { /* ignore */ }

  let fragrances;
  try {
    fragrances = await searchFragrances(query, 100);
  } catch {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-xl mb-2">Could not connect to database.</p>
        <p className="text-sm">Check that your Supabase project is active.</p>
      </div>
    );
  }

  if (fragrances.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-xl mb-2">No results for &ldquo;{query}&rdquo;</p>
        <p className="text-sm">Try a different spelling or browse all fragrances.</p>
      </div>
    );
  }

  const withPrices = await Promise.all(
    fragrances.map(async (f) => {
      const prices = await getFragrancePrices(f.id);
      const inStockPrices = prices.filter((p) => p.last_in_stock);
      const cheapest = inStockPrices[0] ?? prices[0] ?? null;
      return { fragrance: f, cheapest, storeCount: prices.length, allPrices: prices };
    })
  );

  let filtered = inStock ? withPrices.filter((r) => r.allPrices.some((p) => p.last_in_stock)) : withPrices;

  if (sort === 'price_asc') {
    filtered = [...filtered].sort((a, b) => (a.cheapest?.last_price ?? Infinity) - (b.cheapest?.last_price ?? Infinity));
  } else if (sort === 'price_desc') {
    filtered = [...filtered].sort((a, b) => (b.cheapest?.last_price ?? 0) - (a.cheapest?.last_price ?? 0));
  }

  return (
    <>
      <p className="text-sm text-gray-500 mb-4">
        Showing {filtered.length} {filtered.length === 1 ? 'fragrance' : 'fragrances'}
        {!query && total > 0 && ` from ${total} total`}
      </p>
      <div className="flex flex-col gap-3">
        {filtered.map(({ fragrance, cheapest, storeCount, allPrices }) => (
          <FragranceListItem
            key={fragrance.id}
            fragrance={fragrance}
            cheapest={cheapest}
            storeCount={storeCount}
            allPrices={allPrices}
          />
        ))}
      </div>
    </>
  );
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q ?? '';
  const inStock = searchParams.inStock === 'true';
  const sort = searchParams.sort ?? 'popular';

  function chipHref(params: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    if (query) p.set('q', query);
    if (params.inStock !== undefined) { if (params.inStock) p.set('inStock', params.inStock); }
    else if (inStock) p.set('inStock', 'true');
    if (params.sort !== undefined) { if (params.sort) p.set('sort', params.sort); }
    else if (sort && sort !== 'popular') p.set('sort', sort);
    return `/search?${p.toString()}`;
  }

  const sortOptions = [
    { label: 'Most Popular', value: 'popular' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Search Fragrances</h1>
        <p className="text-gray-500 text-sm mb-6">
          Browse our catalog of niche and designer fragrances from top houses. Search by brand or name to compare prices.
        </p>

        {/* Search bar */}
        <form action="/search" method="GET" className="flex gap-2 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search by brand or fragrance name…"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <button type="submit" className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
            Search
          </button>
        </form>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {sortOptions.map((opt) => (
            <Link
              key={opt.value}
              href={chipHref({ sort: opt.value === 'popular' ? undefined : opt.value })}
              className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${
                sort === opt.value || (opt.value === 'popular' && sort === 'popular')
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400'
              }`}
            >
              {opt.label}
            </Link>
          ))}

          <Link
            href={chipHref({ inStock: inStock ? undefined : 'true' })}
            className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${
              inStock
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400'
            }`}
          >
            In Stock
          </Link>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex flex-col gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        }
      >
        <Results query={query} inStock={inStock} sort={sort} />
      </Suspense>
    </div>
  );
}
