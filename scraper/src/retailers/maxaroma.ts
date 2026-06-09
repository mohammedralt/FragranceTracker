import { BaseScraper } from './base';
import { ProductListing, RetailerConfig } from '../types';
import logger from '../logger';

// MaxAroma runs on Magento — predictable structure
const CONFIG: RetailerConfig = {
  key: 'maxaroma',
  name: 'MaxAroma',
  base_url: 'https://www.maxaroma.com',
  currency: 'USD',
  search_url_template: 'https://www.maxaroma.com/catalogsearch/result/?q={query}',
};

export class MaxAromaScraper extends BaseScraper {
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

      // Magento stores typically use .product-item or li.item.product
      await page.waitForSelector('.product-item, li.item.product', { timeout: 15_000 }).catch(() => null);

      const items = await page.evaluate(() => {
        // VERIFY: Magento 2 uses `.product-item` with `.product-item-name`, `.price-box`
        const cards = document.querySelectorAll('.product-item, li.item.product');
        return Array.from(cards).map((card) => ({
          name: card.querySelector('.product-item-name a, .product-name a')?.textContent?.trim() ?? '',
          brand: card.querySelector('.product-brand, [data-brand]')?.textContent?.trim() ?? '',
          priceText: card.querySelector('.price-box .price, .special-price .price')?.textContent?.trim() ?? '',
          href: (card.querySelector('.product-item-name a, .product-name a') as HTMLAnchorElement)?.href ?? '',
          imageSrc: (card.querySelector('img.product-image-photo') as HTMLImageElement)?.src ?? '',
          sizeText: card.querySelector('.product-size, [data-size]')?.textContent?.trim() ?? '',
          inStock: !card.querySelector('.out-of-stock, .unavailable'),
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
    } catch (err) {
      logger.warn({ err }, 'maxaroma search failed');
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

      const data = await page.evaluate(() => {
        // VERIFY: Magento 2 product page uses [itemprop="name"], .product-info-price .price
        const name = document.querySelector('[itemprop="name"], h1.page-title')?.textContent?.trim() ?? '';
        const brand = document.querySelector('[itemprop="brand"], .product-brand')?.textContent?.trim() ?? '';
        const priceText = document.querySelector('[itemprop="price"], .product-info-price .price')?.textContent?.trim() ?? '';
        const sizeText = document.querySelector('.swatch-attribute.size .swatch-attribute-selected-option, .product-size')?.textContent?.trim() ?? '';
        const imageSrc = (document.querySelector('[itemprop="image"], img.gallery-placeholder__image') as HTMLImageElement)?.src ?? '';
        const outOfStock = !!document.querySelector('.stock.unavailable, [data-stock="out"]');
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
      logger.warn({ url, err }, 'maxaroma product page scrape failed');
      return null;
    } finally {
      await page.close();
    }
  }
}
