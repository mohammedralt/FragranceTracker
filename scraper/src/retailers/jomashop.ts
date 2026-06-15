import { BaseScraper } from './base';
import { ProductListing, RetailerConfig } from '../types';
import logger from '../logger';

const CONFIG: RetailerConfig = {
  key: 'jomashop',
  name: 'Jomashop',
  base_url: 'https://www.jomashop.com',
  currency: 'USD',
  // Jomashop uses a category search URL; fragrance department is /fragrance
  search_url_template: 'https://www.jomashop.com/fragrance.html?q={query}',
};

export class JomashopScraper extends BaseScraper {
  constructor() {
    super(CONFIG);
  }

  async searchProducts(query: string): Promise<ProductListing[]> {
    const page = await this.newPage();
    const products: ProductListing[] = [];

    try {
      const url = this.buildSearchUrl(query);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await this.randomDelay(1500, 2500);

      // Jomashop uses Cloudflare — you may see a challenge page.
      // If so, waitForNavigation after the challenge auto-solves (or use a proxy).
      const isChallenged = await page.evaluate(() =>
        document.title.toLowerCase().includes('just a moment') ||
        document.title.toLowerCase().includes('cloudflare')
      );
      if (isChallenged) {
        logger.warn({ retailer: 'jomashop' }, 'Cloudflare challenge detected — waiting for auto-solve');
        await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20_000 }).catch(() => null);
      }

      // VERIFY: Jomashop product cards are likely `.product-item` or `[data-product-sku]`
      await page.waitForSelector('.product-item, [data-product-sku]', { timeout: 15_000 }).catch(() => null);

      const items = await page.evaluate(() => {
        const cards = document.querySelectorAll('.product-item, [data-product-sku]');
        return Array.from(cards).map((card) => ({
          name: card.querySelector('.product-name, .item-name')?.textContent?.trim() ?? '',
          brand: card.querySelector('.product-brand, .brand')?.textContent?.trim() ?? '',
          priceText: card.querySelector('.price, .product-price')?.textContent?.trim() ?? '',
          href: (card.querySelector('a.product-link, a.item-link') as HTMLAnchorElement)?.href ?? '',
          imageSrc: (card.querySelector('img') as HTMLImageElement)?.src ?? '',
          sizeText: card.querySelector('.product-size, .size')?.textContent?.trim() ?? '',
          inStock: !card.querySelector('.out-of-stock, .sold-out'),
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
          variant_label: size.ml ? `${size.ml}ml / ${(size.ml / 29.5735).toFixed(1)} oz` : null,
          url: item.href.startsWith('http') ? item.href : CONFIG.base_url + item.href,
          image_url: item.imageSrc || null,
          in_stock: item.inStock,
        });
      }
    } catch (err) {
      logger.warn({ err }, 'jomashop search failed');
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
        // VERIFY: Jomashop product page selectors
        const name = document.querySelector('h1.product-title, [itemprop="name"]')?.textContent?.trim() ?? '';
        const brand = document.querySelector('[itemprop="brand"], .product-brand')?.textContent?.trim() ?? '';
        const priceText = document.querySelector('[itemprop="price"], .price-box .price')?.textContent?.trim() ?? '';
        const sizeText = document.querySelector('.size-option.selected, .product-size')?.textContent?.trim() ?? '';
        const imageSrc = (document.querySelector('[itemprop="image"], img.product-image') as HTMLImageElement)?.src ?? '';
        const outOfStock = !!document.querySelector('.out-of-stock, [data-out-of-stock]');
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
        variant_label: size.ml ? `${size.ml}ml / ${(size.ml / 29.5735).toFixed(1)} oz` : null,
        url,
        image_url: data.imageSrc || null,
        in_stock: !data.outOfStock,
      };
    } catch (err) {
      logger.warn({ url, err }, 'jomashop product page scrape failed');
      return null;
    } finally {
      await page.close();
    }
  }
}
