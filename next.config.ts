import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/a/**',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'avatar.vercel.sh',
        pathname: '/**',
        port: '',
      },
    ],
    minimumCacheTTL: 60, // Cache successful image loads for 60 seconds
    deviceSizes: [32, 48, 64, 96], // We only use small avatar sizes
    imageSizes: [], // We don't need additional sizes for avatars
  },
};

export default nextConfig;