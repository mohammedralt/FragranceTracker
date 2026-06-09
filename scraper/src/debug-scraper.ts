/**
 * Dumps the HTML of a search results page so we can find the right CSS selectors.
 * Usage: ts-node src/debug-scraper.ts fragrancenet "sauvage"
 */
import 'dotenv/config';
import { chromium } from 'playwright';
import * as fs from 'fs';

async function main() {
  const [retailer, ...queryParts] = process.argv.slice(2);
  const query = queryParts.join(' ') || 'sauvage';

  const urls: Record<string, string> = {
    fragrancenet: `https://www.fragrancenet.com/search?q=${encodeURIComponent(query)}`,
    jomashop:     `https://www.jomashop.com/search?q=${encodeURIComponent(query)}&category=Fragrance`,
    maxaroma:     `https://www.maxaroma.com/search?q=${encodeURIComponent(query)}`,
    fragrancebuy: `https://www.fragrancebuy.ca/search?type=product&q=${encodeURIComponent(query)}`,
  };

  const url = urls[retailer];
  if (!url) {
    console.error(`Unknown retailer. Choose: ${Object.keys(urls).join(', ')}`);
    process.exit(1);
  }

  console.log(`Opening: ${url}`);
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  // Wait up to 8s for product cards to appear, then proceed regardless
  await page.waitForSelector('[data-testid="product-grid-card-undefined"], .product-card', { timeout: 8000 }).catch(() => null);
  await page.waitForTimeout(2000);

  const html = await page.content();
  const outFile = `debug-${retailer}.html`;
  fs.writeFileSync(outFile, html);
  console.log(`\nSaved HTML to ${outFile} (${Math.round(html.length / 1024)}kb)`);
  console.log('Browser left open — inspect the page, then close it.');

  // Also log all unique class names from product-looking elements
  const classes = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('[class]'));
    const names = new Set<string>();
    all.forEach(el => {
      el.className.toString().split(/\s+/).forEach(c => {
        if (c && (c.includes('product') || c.includes('item') || c.includes('card') || c.includes('tile') || c.includes('price') || c.includes('result')))
          names.add(c);
      });
    });
    return Array.from(names).sort();
  });
  console.log('\nProduct-related class names found on page:');
  console.log(classes.join('\n'));

  await browser.close();
}

main().catch(console.error);
