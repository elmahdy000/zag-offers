import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.zagoffers.online',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
