/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'avatar.vercel.sh',  // Allow Vercel avatar service
      'lh3.googleusercontent.com',  // Allow Google profile pictures
    ],
  },
};

module.exports = nextConfig; 