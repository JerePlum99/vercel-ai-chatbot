/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/a/**',  // Google profile pics follow this pattern
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
  experimental: {
    // Enable better Node.js support
    serverActions: {
      allowedOrigins: ['localhost:3000'],
      bodySizeLimit: '2mb',
    },
  },
  // Ensure middleware uses Node.js runtime
  transpilePackages: ['better-auth'],
};

module.exports = nextConfig; 