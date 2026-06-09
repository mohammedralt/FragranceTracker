import { Page } from 'playwright';
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
      await this.randomDelay(1000, 2000);

      // VERIFY: Inspect fragrancenet.com search results to confirm selector
      // Products are in a grid; each card typically has class like .product-tile or [data-product]
      await page.waitForSelector('.product-tile, [data-component="ProductCard"]', {
        timeout: 15_000,
      }).catch(() => null);

      const items = await page.evaluate(() => {
        // VERIFY selectors against live DOM before shipping
        const cards = document.querySelectorAll('.product-tile, [data-component="ProductCard"]');
        return Array.from(cards).map((card) => ({
          name: card.querySelector('.product-name, [data-component="ProductName"]')?.textContent?.trim() ?? '',
          brand: card.querySelector('.brand-name, [data-component="BrandName"]')?.textContent?.trim() ?? '',
          priceText: card.querySelector('.product-price, [data-component="Price"] .price')?.textContent?.trim() ?? '',
          href: (card.querySelector('a.product-link, a[data-component="ProductLink"]') as HTMLAnchorElement)?.href ?? '',
          imageSrc: (card.querySelector('img.product-image') as HTMLImageElement)?.src ?? '',
          sizeText: card.querySelector('.product-size, [data-component="Size"]')?.textContent?.trim() ?? '',
          inStock: !card.querySelector('.out-of-stock, [data-component="OutOfStock"]'),
        }));
      });

      for (const item of items) {
        if (!item.name || !item.href) continue;
        const price = this.parsePrice(item.priceText);
        if (!price) continue;
        const size = this.parseSize(item.sizeText || item.name);

        products.push({
          name: item.name,
          brand: item.brand || query,
          price,
          currency: 'USD',
          size_ml: size.ml,
          url: item.href.startsWith('http') ? item.href : CONFIG.base_url + item.href,
          image_url: item.imageSrc || null,
          in_stock: item.inStock,
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
      await this.randomDelay(800, 1500);

      // VERIFY: On a product page, fragrancenet shows size options as a dropdown or button group
      const data = await page.evaluate(() => {
        const name = document.querySelector('h1.product-title, [data-component="ProductTitle"]')?.textContent?.trim() ?? '';
        const brand = document.querySelector('.brand-name, [itemprop="brand"]')?.textContent?.trim() ?? '';
        const priceText = document.querySelector('[data-component="Price"] .price, .product-price')?.textContent?.trim() ?? '';
        const sizeText = document.querySelector('.selected-size, [data-component="SelectedSize"]')?.textContent?.trim() ?? '';
        const imageSrc = (document.querySelector('img.product-main-image') as HTMLImageElement)?.src ?? '';
        const outOfStock = !!document.querySelector('.out-of-stock-label, [data-component="OutOfStock"]');
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
