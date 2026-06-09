/** @type {import('next').NextConfig} */
const config = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.fragrancenet.com' },
      { protocol: 'https', hostname: '**.jomashop.com' },
      { protocol: 'https', hostname: '**.maxaroma.com' },
      { protocol: 'https', hostname: '**.fragrancebuy.ca' },
      { protocol: 'https', hostname: '**.cdn.shopify.com' },
    ],
  },
};

module.exports = config;
