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
    deviceSizes: [32, 48, 64, 96, 128, 256, 384, 512], // Added larger sizes for brand assets
    imageSizes: [16, 32, 48, 64, 96, 128, 256], // Added image sizes for optimal scaling
    formats: ['image/webp'], // Use WebP for better quality/size ratio
  },
};

export default nextConfig;