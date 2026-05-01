/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 24 * 365, // 1 year for static images
  },
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
  // Enable SWC minification and optimization
  swcMinify: true,
  // Optimize production builds
  productionBrowserSourceMaps: false,
};

export default nextConfig;
