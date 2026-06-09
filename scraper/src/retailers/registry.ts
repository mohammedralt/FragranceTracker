import { BaseScraper } from './base';
import { FragranceNetScraper } from './fragrancenet';
import { JomashopScraper } from './jomashop';
import { MaxAromaScraper } from './maxaroma';
import { FragranceBuyScraper } from './fragrancebuy';

// Add new retailer scrapers here as you implement them
const SCRAPERS: Record<string, () => BaseScraper> = {
  fragrancenet: () => new FragranceNetScraper(),
  jomashop: () => new JomashopScraper(),
  maxaroma: () => new MaxAromaScraper(),
  fragrancebuy: () => new FragranceBuyScraper(),
};

export function getScraper(retailerKey: string): BaseScraper {
  const factory = SCRAPERS[retailerKey];
  if (!factory) throw new Error(`No scraper registered for retailer key: ${retailerKey}`);
  return factory();
}

export function getRetailerKeys(): string[] {
  return Object.keys(SCRAPERS);
}
