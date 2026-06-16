/**
 * Backfills fragrances.image_url using the product image from a Shopify listing.
 * Most retailers are Shopify, so we fetch {product_url}.json and read the image.
 *
 * Run from the web/ folder:  node backfill-images.mjs
 */
import { readFileSync } from 'fs';
import pg from 'pg';

const env = readFileSync('.env.local', 'utf8');
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3, connectionTimeoutMillis: 8000 });
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36';

async function fetchShopifyImage(productUrl) {
  const base = productUrl.split('?')[0].replace(/\/$/, '');
  for (const suffix of ['.json', '.js']) {
    try {
      const r = await fetch(base + suffix, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(12000) });
      if (!r.ok) continue;
      const data = await r.json();
      const p = data.product ?? data; // .json wraps in {product}, .js is flat
      const img = p.image?.src ?? p.images?.[0]?.src ?? p.images?.[0] ?? p.featured_image?.src ?? p.featured_image;
      if (typeof img === 'string') return img.startsWith('//') ? 'https:' + img : img;
    } catch { /* try next */ }
  }
  return null;
}

try {
  const { rows } = await pool.query(`
    SELECT f.id, f.brand, f.name, (
      SELECT tp.product_url FROM tracked_products tp
      WHERE tp.fragrance_id = f.id AND tp.product_url LIKE '%/products/%'
      ORDER BY tp.last_price ASC NULLS LAST LIMIT 1
    ) AS shopify_url
    FROM fragrances f
    WHERE f.image_url IS NULL`);

  const targets = rows.filter((r) => r.shopify_url);
  console.log(`${rows.length} fragrances missing images; ${targets.length} have a Shopify listing to pull from.\n`);

  let filled = 0;
  for (const r of targets) {
    const img = await fetchShopifyImage(r.shopify_url);
    if (img) {
      await pool.query(`UPDATE fragrances SET image_url = $1 WHERE id = $2`, [img, r.id]);
      filled++;
      console.log(`  ✓ ${r.brand} ${r.name}`);
    } else {
      console.log(`  ✗ ${r.brand} ${r.name} (no image found)`);
    }
  }
  console.log(`\nDone — filled ${filled} images.`);
} catch (err) {
  console.error('FAILED:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
