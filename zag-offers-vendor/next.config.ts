
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/service-worker.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }],
      },
      {
        source: '/icon-:size.png',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
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
