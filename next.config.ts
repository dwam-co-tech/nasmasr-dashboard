import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.nasmasr.app',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
