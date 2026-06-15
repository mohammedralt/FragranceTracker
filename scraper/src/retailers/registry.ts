import { BaseScraper } from './base';
import { ShopifyScraper } from './shopify';
import { JomashopScraper } from './jomashop';

const SHOPIFY_RETAILERS = [
  { key: 'fragflex',       name: 'FragFlex',               base_url: 'https://fragflex.com',                 currency: 'USD' },
  { key: 'beautyhouse',    name: 'Beauty House',           base_url: 'https://beautyhouse.com',              currency: 'USD' },
  { key: 'arvella',        name: 'Arvella Fragrance',      base_url: 'https://arvellafragrance.com',         currency: 'USD' },
  { key: 'aura',           name: 'Aura Fragrance',         base_url: 'https://www.aurafragrance.com',        currency: 'USD' },
  { key: 'venba',          name: 'Venba Fragrance',        base_url: 'https://www.venbafragrance.com',       currency: 'USD' },
  { key: 'olfactory',      name: 'Olfactory Factory',      base_url: 'https://www.olfactoryfactoryllc.com',  currency: 'USD' },
  { key: 'fragranceneveah',name: 'Fragrance Nevaeh',       base_url: 'https://fragrance-nevaeh.com',         currency: 'USD' },
  { key: 'emntscents',     name: 'Emnt Scents',            base_url: 'https://emntscents.com',               currency: 'USD' },
  { key: 'fragrancelord',  name: 'Fragrance Lord',         base_url: 'https://www.fragrancelord.com',        currency: 'USD' },
] as const;

const SCRAPERS: Record<string, () => BaseScraper> = {
  jomashop: () => new JomashopScraper(),
};

for (const r of SHOPIFY_RETAILERS) {
  SCRAPERS[r.key] = () => new ShopifyScraper({
    key: r.key,
    name: r.name,
    base_url: r.base_url,
    currency: r.currency,
    search_url_template: `${r.base_url}/search/suggest.json?q={query}&resources[type]=product&resources[limit]=20`,
  });
}

export function getScraper(retailerKey: string): BaseScraper {
  const factory = SCRAPERS[retailerKey];
  if (!factory) throw new Error(`No scraper registered for retailer key: ${retailerKey}`);
  return factory();
}

export function getRetailerKeys(): string[] {
  return Object.keys(SCRAPERS);
}
