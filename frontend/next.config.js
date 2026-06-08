/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Suppress optional dependency warnings
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
    };
    return config;
  },

  reactStrictMode: true,
  swcMinify: true,

  // Extra recommended settings
  poweredByHeader: false,           // Hide "Powered by Next.js"
  compress: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Better caching for static assets
  headers: async () => [
    {
      source: "/fonts/:path*",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
  ],
};

module.exports = nextConfig;