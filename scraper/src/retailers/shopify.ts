/**
 * Generic Shopify scraper — works for any Shopify store via their predictive search API.
 * Uses direct HTTP (no browser needed) since these stores don't require Cloudflare cookies.
 */
import axios from 'axios';
import { BaseScraper } from './base';
import { ProductListing, RetailerConfig, ScrapeResult } from '../types';
import { parseSize } from '../utils';
import logger from '../logger';

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

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept': 'application/json',
};

export class ShopifyScraper extends BaseScraper {
  constructor(config: RetailerConfig) {
    super(config);
  }

  async searchProducts(query: string): Promise<ProductListing[]> {
    const url = `${this.config.base_url}/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=20`;
    const products: ProductListing[] = [];

    try {
      const { data } = await axios.get<{ resources: { results: { products: ShopifyProduct[] } } }>(url, {
        headers: HEADERS,
        timeout: 15_000,
      });

      const items = data?.resources?.results?.products ?? [];

      for (const item of items) {
        const variants = item.variants ?? [];
        const available = variants.filter((v) => v.available);
        const best = available.length > 0 ? available[0] : variants[0];

        // Some stores return empty variants array — fall back to top-level price
        const price = best ? parseFloat(best.price) : parseFloat((item as any).price);
        if (!price) continue;

        const sizeSource = best?.title ?? item.title;
        const productUrl = best ? this.config.base_url + best.url : this.config.base_url + item.url;
        const imageUrl = (item as any).featured_image?.url ?? item.image ?? null;

        products.push({
          name: item.title,
          brand: item.vendor || query,
          price,
          currency: this.config.currency,
          size_ml: parseSize(sizeSource).ml,
          url: productUrl,
          image_url: imageUrl,
          in_stock: best ? best.available : item.available,
        });
      }
    } catch (err) {
      logger.warn({ retailer: this.config.key, err }, 'shopify search failed');
    }

    return products;
  }

  // Shopify uses axios — no browser needed, skip launch/close overhead
  override async scrapeSearch(query: string): Promise<ScrapeResult> {
    const start = Date.now();
    let products: ProductListing[] = [];
    let error: string | undefined;
    let success = false;

    try {
      products = await this.searchProducts(query);
      success = true;
      logger.info({ retailer: this.config.key, query, count: products.length }, 'Scrape complete');
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      logger.error({ retailer: this.config.key, query, error }, 'Scrape failed');
    }

    return {
      retailer_key: this.config.key,
      query,
      products,
      scraped_at: new Date(),
      success,
      error,
      duration_ms: Date.now() - start,
    };
  }

  async scrapeProductPage(url: string): Promise<ProductListing | null> {
    const handle = url.match(/\/products\/([^?#/]+)/)?.[1];
    if (!handle) return null;

    try {
      const { data } = await axios.get(`${this.config.base_url}/products/${handle}.js`, {
        headers: HEADERS,
        timeout: 15_000,
      });

      const variants: ShopifyVariant[] = data.variants ?? [];
      const available = variants.filter((v) => v.available);
      const best = available[0] ?? variants[0];
      if (!best) return null;

      // product.js prices are in cents
      const price = parseFloat(best.price) / 100;

      return {
        name: data.title,
        brand: data.vendor,
        price,
        currency: this.config.currency,
        size_ml: parseSize(best.title).ml,
        url: `${this.config.base_url}/products/${handle}?variant=${best.id}`,
        image_url: data.featured_image ?? null,
        in_stock: best.available,
      };
    } catch (err) {
      logger.warn({ url, err }, 'shopify product page scrape failed');
      return null;
    }
  }
}
