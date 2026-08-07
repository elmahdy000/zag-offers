
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2_592_000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.zagoffers.online',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3010',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
    ],
  },
};

export default nextConfig;
