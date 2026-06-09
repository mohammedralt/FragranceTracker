/**
 * Worker: picks up scrape jobs from BullMQ, runs the appropriate retailer scraper,
 * saves price snapshots, and fires email alerts when thresholds are crossed.
 *
 * Usage: ts-node src/queue/worker.ts
 */
import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { getScraper } from '../retailers/registry';
import { recordPriceSnapshot, getWatchersToNotify, logNotificationSent } from '../db/client';
import { ScrapeJobPayload } from '../types';
import { sendPriceAlert } from '../notifications/email';
import logger from '../logger';

const QUEUE_NAME = 'scrape-jobs';
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY ?? '3');

const connection = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379'),
  password: process.env.REDIS_PASSWORD,
  ...(process.env.REDIS_TLS === 'true' && { tls: {} }),
};

async function processJob(job: Job<ScrapeJobPayload>): Promise<void> {
  const { tracked_product_id, retailer_key, product_url, fragrance_id } = job.data;
  logger.info({ jobId: job.id, retailer_key, product_url }, 'Processing scrape job');

  const scraper = getScraper(retailer_key);
  const result = await scraper.scrapeUrl(product_url);

  if (!result.success || result.products.length === 0) {
    logger.warn({ retailer_key, product_url, error: result.error }, 'Scrape returned no products');
    return;
  }

  const product = result.products[0];
  await recordPriceSnapshot(tracked_product_id, product.price, product.currency, product.in_stock);
  logger.info({ retailer_key, price: product.price, currency: product.currency }, 'Price recorded');

  // Check if any user should be notified
  const watchers = await getWatchersToNotify(
    fragrance_id,
    product.price,
    product.currency,
    tracked_product_id
  );

  for (const watcher of watchers) {
    try {
      await sendPriceAlert({
        toEmail: watcher.email,
        fragranceName: product.name,
        brand: product.brand,
        retailerName: retailer_key,
        price: product.price,
        currency: product.currency,
        productUrl: product_url,
        threshold: watcher.alert_threshold,
      });

      await logNotificationSent(
        watcher.user_id,
        watcher.watchlist_item_id,
        tracked_product_id,
        product.price
      );
    } catch (err) {
      logger.error({ err, userId: watcher.user_id }, 'Failed to send price alert email');
    }
  }
}

const worker = new Worker<ScrapeJobPayload>(QUEUE_NAME, processJob, {
  connection,
  concurrency: CONCURRENCY,
});

worker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Job completed');
});

worker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Job failed');
});

logger.info({ concurrency: CONCURRENCY }, 'Worker started');

process.on('SIGTERM', async () => {
  await worker.close();
  process.exit(0);
});
