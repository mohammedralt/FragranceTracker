import { BaseScraper } from './base';
import { ProductListing, RetailerConfig } from '../types';
import { parseSize } from '../utils';
import logger from '../logger';

const CONFIG: RetailerConfig = {
  key: 'fragrancebuy',
  name: 'FragranceBuy.ca',
  base_url: 'https://www.fragrancebuy.ca',
  currency: 'CAD',
  search_url_template: 'https://www.fragrancebuy.ca/search/suggest.json?q={query}&resources[type]=product&resources[limit]=20',
};

interface ShopifyVariant {
  id: number;
  title: string;
  price: string;
  available: boolean;
  url: string;
}

interface ShopifyProduct {
  title: string;
  vendor: string;
  url: string;
  image: string;
  available: boolean;
  variants: ShopifyVariant[];
}

export class FragranceBuyScraper extends BaseScraper {
  constructor() {
    super(CONFIG);
  }

  async searchProducts(query: string): Promise<ProductListing[]> {
    const page = await this.newPage();
    const products: ProductListing[] = [];

    try {
      // Load homepage first to get Cloudflare session cookies
      await page.goto('https://www.fragrancebuy.ca', { waitUntil: 'domcontentloaded', timeout: 20_000 });
      await this.randomDelay(800, 1500);

      // Call the Shopify predictive search API from within the browser context (uses session cookies)
      const apiUrl = `/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=20`;
      const result = await page.evaluate(async (url) => {
        const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!resp.ok) return null;
        return resp.json();
      }, apiUrl);

      const items: ShopifyProduct[] = result?.resources?.results?.products ?? [];

      for (const item of items) {
        const variants = item.variants ?? [];
        const available = variants.filter(v => v.available);
        const best = available.length > 0 ? available[0] : variants[0];
        if (!best) continue;

        const price = parseFloat(best.price);
        if (!price) continue;

        products.push({
          name: item.title,
          brand: item.vendor || query,
          price,
          currency: 'CAD',
          size_ml: parseSize(best.title).ml,
          variant_label: best.title && best.title.toLowerCase() !== 'default title' ? best.title : null,
          url: CONFIG.base_url + best.url,
          image_url: item.image ?? null,
          in_stock: best.available,
        });
      }
    } catch (err) {
      logger.warn({ err }, 'fragrancebuy search failed');
    } finally {
      await page.close();
    }

    return products;
  }

  async scrapeProductPage(url: string): Promise<ProductListing | null> {
    const handle = url.match(/\/products\/([^?#/]+)/)?.[1];
    if (!handle) return null;

    const page = await this.newPage();

    try {
      await page.goto('https://www.fragrancebuy.ca', { waitUntil: 'domcontentloaded', timeout: 20_000 });
      await this.randomDelay(500, 1000);

      const data = await page.evaluate(async (h) => {
        const resp = await fetch(`/products/${h}.js`, { headers: { 'Accept': 'application/json' } });
        if (!resp.ok) return null;
        return resp.json();
      }, handle);

      if (!data) return null;

      // product.js prices are in cents
      const variants: ShopifyVariant[] = data.variants ?? [];
      const available = variants.filter(v => v.available);
      const best = available[0] ?? variants[0];
      if (!best) return null;

      const price = parseFloat(best.price) / 100;
      const size = parseSize(best.title);

      return {
        name: data.title,
        brand: data.vendor,
        price,
        currency: 'CAD',
        size_ml: size.ml,
        variant_label: best.title && best.title.toLowerCase() !== 'default title' ? best.title : null,
        url: `${CONFIG.base_url}/products/${handle}?variant=${best.id}`,
        image_url: data.featured_image ?? null,
        in_stock: best.available,
      };
    } catch (err) {
      logger.warn({ url, err }, 'fragrancebuy product page scrape failed');
      return null;
    } finally {
      await page.close();
    }
  }
}
