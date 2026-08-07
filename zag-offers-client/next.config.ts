import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        // Static assets
        urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "fonts-cache",
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
          },
        },
      },
      {
        // Static assets (CSS, JS, etc.)
        urlPattern: /\.(?:js|css|woff2?|png|jpg|jpeg|svg|gif|webp)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-assets",
        },
      },
      {
        // Images (external or remote patterns)
        urlPattern: /^https:\/\/api\.zagoffers\.online\/uploads\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "images-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      {
        // Pages / Navigation
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: "NetworkFirst",
        options: {
          cacheName: "pages-cache",
          networkTimeoutSeconds: 10,
          plugins: [
            {
              // Custom offline fallback
              handlerDidError: async () => {
                return (await caches.match('/offline')) || Response.error();
              }
            }
          ]
        },
      }
    ],
  },
});

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    // Uploaded offer images are already WebP and are served by our API CDN.
    // Serving them directly avoids intermittent optimizer 502s.
    unoptimized: true,
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

export default withPWA(nextConfig);
