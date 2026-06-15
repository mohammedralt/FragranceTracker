import { BaseScraper } from './base';
import { ProductListing, RetailerConfig } from '../types';
import logger from '../logger';

const CONFIG: RetailerConfig = {
  key: 'fragrancenet',
  name: 'FragranceNet',
  base_url: 'https://www.fragrancenet.com',
  currency: 'USD',
  search_url_template: 'https://www.fragrancenet.com/search?q={query}',
};

export class FragranceNetScraper extends BaseScraper {
  constructor() {
    super(CONFIG);
  }

  async searchProducts(query: string): Promise<ProductListing[]> {
    const page = await this.newPage();
    const products: ProductListing[] = [];

    try {
      const url = this.buildSearchUrl(query);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      // Wait for search result cards to appear (up to 12s)
      await page.waitForSelector('[data-testid="product-grid-card-undefined"]', { timeout: 12_000 }).catch(() => null);
      await this.randomDelay(1500, 2500);

      const items = await page.evaluate(() => {
        const cards = document.querySelectorAll('[data-testid="product-grid-card-undefined"]');
        return Array.from(cards).map((card) => {
          const titleEl = card.querySelector('[data-testid="product-card-title"]') as HTMLAnchorElement | null;
          const imgEl = card.querySelector('img[alt]') as HTMLImageElement | null;
          const sizeText = card.querySelector('.truncate.text-black.thin-font')?.textContent?.trim() ?? '';

          // Price lives in a <p> or <span> with a $ sign — walk all text nodes
          let priceText = '';
          card.querySelectorAll('p, span, div').forEach((el) => {
            const t = el.textContent?.trim() ?? '';
            if (!priceText && /^\$[0-9]/.test(t) && el.children.length === 0) priceText = t;
          });

          return {
            name: titleEl?.textContent?.trim() ?? '',
            href: titleEl?.href ?? '',
            imageSrc: imgEl?.src ?? imgEl?.dataset?.src ?? '',
            sizeText,
            priceText,
          };
        });
      });

      for (const item of items) {
        if (!item.name || !item.href) continue;
        const price = this.parsePrice(item.priceText);
        if (!price) continue;
        const size = this.parseSize(item.sizeText || item.name);

        // Brand is not in the card — extract from URL path: /fn/cologne/{brand}/...
        const brandMatch = item.href.match(/\/fn\/(?:cologne|perfume|fragrance)\/([^/]+)\//);
        const brand = brandMatch
          ? brandMatch[1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
          : query;

        products.push({
          name: item.name,
          brand,
          price,
          currency: 'USD',
          size_ml: size.ml,
          url: item.href.startsWith('http') ? item.href : CONFIG.base_url + item.href,
          image_url: item.imageSrc || null,
          in_stock: true,
        });
      }
    } finally {
      await page.close();
    }

    return products;
  }

  async scrapeProductPage(url: string): Promise<ProductListing | null> {
    const page = await this.newPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await this.randomDelay(1000, 2000);

      const data = await page.evaluate(() => {
        const name = document.querySelector('h1')?.textContent?.trim() ?? '';
        const brandMatch = window.location.pathname.match(/\/fn\/(?:cologne|perfume|fragrance)\/([^/]+)\//);
        const brand = brandMatch ? brandMatch[1].replace(/-/g, ' ') : '';

        let priceText = '';
        document.querySelectorAll('p, span').forEach((el) => {
          const t = el.textContent?.trim() ?? '';
          if (!priceText && /^\$[0-9]/.test(t) && el.children.length === 0) priceText = t;
        });

        const sizeText = document.querySelector('[class*="size"], [class*="Size"]')?.textContent?.trim() ?? '';
        const imageSrc = (document.querySelector('img[alt][src*="cdn.fragrancenet"]') as HTMLImageElement)?.src ?? '';
        const outOfStock = document.body.textContent?.toLowerCase().includes('out of stock') ?? false;

        return { name, brand, priceText, sizeText, imageSrc, outOfStock };
      });

      const price = this.parsePrice(data.priceText);
      if (!data.name || !price) return null;

      const size = this.parseSize(data.sizeText || data.name);
      return {
        name: data.name,
        brand: data.brand,
        price,
        currency: 'USD',
        size_ml: size.ml,
        url,
        image_url: data.imageSrc || null,
        in_stock: !data.outOfStock,
      };
    } catch (err) {
      logger.warn({ url, err }, 'fragrancenet product page scrape failed');
      return null;
    } finally {
      await page.close();
    }
  }
}
