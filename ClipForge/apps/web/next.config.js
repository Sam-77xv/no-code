/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['yt-dlp-exec', 'ffmpeg-static'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.youtube.com',
      },
      {
        protocol: 'https',
        hostname: '*.tiktok.com',
      },
      {
        protocol: 'https',
        hostname: '*.instagram.com',
      },
      {
        protocol: 'https',
        hostname: '*.facebook.com',
      },
    ],
  },
};

module.exports = nextConfig;
