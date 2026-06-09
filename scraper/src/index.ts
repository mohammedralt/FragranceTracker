/**
 * Main entry point — prints a summary of registered scrapers and DB status.
 * The actual runtime is split into two long-running processes:
 *   npm run scheduler   (enqueues jobs every 12 hours)
 *   npm run worker      (processes jobs from the queue)
 */
import 'dotenv/config';
import { getRetailerKeys } from './retailers/registry';
import { getActiveRetailers } from './db/client';
import logger from './logger';

async function main() {
  console.log('\n=== Fragrance Price Scraper ===\n');
  console.log('Registered scrapers:', getRetailerKeys().join(', '));

  try {
    const retailers = await getActiveRetailers();
    console.log(`\nActive retailers in DB: ${retailers.length}`);
    retailers.forEach((r) => console.log(`  • ${r.name} (${r.key})`));
  } catch (err) {
    logger.warn({ err }, 'Could not connect to DB — check DATABASE_URL in .env');
  }

  console.log(`
Commands:
  npm run scrape fragrancenet "bleu de chanel"   # test a single scraper
  npm run scheduler                               # start the 12-hour scheduler
  npm run worker                                  # start the queue worker
  `);
}

main();
