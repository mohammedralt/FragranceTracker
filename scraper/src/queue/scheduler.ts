/**
 * Scheduler: runs every 12 hours and enqueues one scrape job per tracked product.
 * Start this process independently alongside the worker.
 *
 * Usage: ts-node src/queue/scheduler.ts
 */
import 'dotenv/config';
import { Queue } from 'bullmq';
import { getAllTrackedProducts } from '../db/client';
import { ScrapeJobPayload } from '../types';
import logger from '../logger';

const QUEUE_NAME = 'scrape-jobs';
const INTERVAL_MS = 12 * 60 * 60 * 1000; // 12 hours

const connection = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379'),
  password: process.env.REDIS_PASSWORD,
  ...(process.env.REDIS_TLS === 'true' && { tls: {} }),
};

const queue = new Queue<ScrapeJobPayload>(QUEUE_NAME, { connection });

async function enqueueAll(): Promise<void> {
  const products = await getAllTrackedProducts();
  logger.info({ count: products.length }, 'Enqueuing scrape jobs');

  const jobs = products.map((p) => ({
    name: `scrape:${p.retailer_key}:${p.id}`,
    data: {
      tracked_product_id: p.id,
      retailer_key: p.retailer_key,
      product_url: p.product_url,
      fragrance_id: p.fragrance_id,
    } satisfies ScrapeJobPayload,
    opts: {
      // Deduplicate: don't add a job that's already waiting for the same product
      jobId: `scrape-${p.id}`,
      attempts: 3,
      backoff: { type: 'exponential', delay: 10_000 },
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 100 },
    },
  }));

  await queue.addBulk(jobs);
  logger.info({ count: jobs.length }, 'Jobs enqueued');
}

async function run(): Promise<void> {
  logger.info('Scheduler starting');
  await enqueueAll();

  setInterval(async () => {
    try {
      await enqueueAll();
    } catch (err) {
      logger.error({ err }, 'Scheduler interval error');
    }
  }, INTERVAL_MS);
}

run().catch((err) => {
  logger.error({ err }, 'Scheduler fatal error');
  process.exit(1);
});
