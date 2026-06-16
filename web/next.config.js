/** @type {import('next').NextConfig} */
const config = {
  images: {
    // Product images come from many retailer CDNs (Shopify stores, Jomashop)
    // plus Fragrantica (fimgs.net) for catalog images. Allow any https host —
    // simplest for a multi-retailer comparison site.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

module.exports = config;
