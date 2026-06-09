import { Suspense } from 'react';
import type { Metadata } from 'next';
import { searchFragrances, getFragrancePrices } from '@/lib/db';
import { FragranceCard } from '@/components/FragranceCard';

interface SearchPageProps {
  searchParams: { q?: string };
}

export function generateMetadata({ searchParams }: SearchPageProps): Metadata {
  const q = searchParams.q ?? '';
  return { title: q ? `"${q}" — Fragrance prices` : 'Browse fragrances' };
}

async function Results({ query }: { query: string }) {
  let fragrances: Awaited<ReturnType<typeof searchFragrances>> = [];
  try {
    fragrances = await searchFragrances(query || '', 48);
  } catch {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-2xl mb-2">Could not connect to database.</p>
        <p className="text-sm">Check that your Supabase project is active.</p>
      </div>
    );
  }

  if (fragrances.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-2xl mb-2">No results for &ldquo;{query}&rdquo;</p>
        <p className="text-sm">Try a different spelling, or browse all fragrances.</p>
      </div>
    );
  }

  const withPrices = await Promise.all(
    fragrances.map(async (f) => {
      const prices = await getFragrancePrices(f.id);
      return { fragrance: f, cheapest: prices[0] ?? null };
    })
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {withPrices.map(({ fragrance, cheapest }) => (
        <FragranceCard key={fragrance.id} fragrance={fragrance} cheapest={cheapest} />
      ))}
    </div>
  );
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q ?? '';

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          {query ? <>Results for &ldquo;{query}&rdquo;</> : 'All fragrances'}
        </h1>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="card aspect-square animate-pulse bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        }
      >
        <Results query={query} />
      </Suspense>
    </div>
  );
}
