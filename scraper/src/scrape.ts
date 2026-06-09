/**
 * One-off test runner — use this to verify a scraper works before wiring it
 * into the queue.
 *
 * Usage:
 *   ts-node src/scrape.ts fragrancenet "bleu de chanel"
 *   ts-node src/scrape.ts jomashop "sauvage dior"
 *   ts-node src/scrape.ts maxaroma "acqua di gio"
 *   ts-node src/scrape.ts fragrancebuy "creed aventus"
 *
 * Add --save to also write results into the database.
 */
import 'dotenv/config';
import { getScraper, getRetailerKeys } from './retailers/registry';
import { saveScrapedProduct } from './db/client';
import logger from './logger';

async function main() {
  const [retailerKey, ...queryParts] = process.argv.slice(2);
  const query = queryParts.join(' ');
  const shouldSave = process.argv.includes('--save');

  if (!retailerKey || !query.replace('--save', '').trim()) {
    console.error(`
Usage: ts-node src/scrape.ts <retailer-key> "<query>" [--save]

Available retailer keys: ${getRetailerKeys().join(', ')}
    `.trim());
    process.exit(1);
  }

  const scraper = getScraper(retailerKey);
  console.log(`\nScraping "${query}" from ${retailerKey}...\n`);

  const result = await scraper.scrapeSearch(query.replace('--save', '').trim());

  if (!result.success) {
    console.error(`Scrape failed: ${result.error}`);
    process.exit(1);
  }

  console.log(`Found ${result.products.length} products in ${result.duration_ms}ms:\n`);

  for (const [i, p] of result.products.entries()) {
    console.log(`${i + 1}. ${p.brand} — ${p.name}`);
    console.log(`   Price:    ${p.currency} $${p.price.toFixed(2)}`);
    console.log(`   Size:     ${p.size_ml ? `${p.size_ml}ml` : 'unknown'}`);
    console.log(`   In stock: ${p.in_stock}`);
    console.log(`   URL:      ${p.url}`);
    console.log();
  }

  if (shouldSave) {
    console.log('Saving to database...');
    for (const product of result.products) {
      const id = await saveScrapedProduct(product, retailerKey);
      if (id) logger.info({ id }, 'Saved tracked product');
    }
    console.log('Done.');
  }
}

main().catch((err) => {
  logger.error({ err }, 'scrape.ts error');
  process.exit(1);
});
