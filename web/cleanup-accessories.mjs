import { readFileSync } from 'fs';
import pg from 'pg';

const env = readFileSync('.env.local', 'utf8');
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2, connectionTimeoutMillis: 8000 });

// URL slug fragments that indicate non-fragrance accessories
const PATTERNS = [
  'body-wash', 'body-lotion', 'body-cream', 'shower-gel', 'bath-gel',
  'hand-cream', 'hand-cleanser', 'hair-perfume', 'hair-mist', 'hair-oil',
  'shampoo', 'conditioner', 'deodorant', 'candle', 'diffuser', 'lip-balm',
  'aftershave', 'after-shave', 'shave-cream', 'body-creme',
];

try {
  const where = PATTERNS.map((_, i) => `product_url ILIKE $${i + 1}`).join(' OR ');
  const params = PATTERNS.map((p) => `%${p}%`);

  const { rows: preview } = await pool.query(
    `SELECT product_url FROM tracked_products WHERE ${where} LIMIT 20`, params);
  console.log('Sample accessory rows to delete:');
  preview.forEach((r) => console.log('  ', r.product_url.slice(0, 90)));

  const { rowCount } = await pool.query(
    `DELETE FROM tracked_products WHERE ${where}`, params);
  console.log(`\n✓ Deleted ${rowCount} accessory listings`);
} catch (err) {
  console.error('CLEANUP FAILED:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
