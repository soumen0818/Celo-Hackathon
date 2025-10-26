/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['avatars.githubusercontent.com', 'github.com', 'images.unsplash.com'],
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Ignore node-specific modules that cause warnings
    config.ignoreWarnings = [
      { module: /node_modules\/@react-native-async-storage/ },
      { module: /node_modules\/pino-pretty/ },
    ];

    return config;
  },
}

module.exports = nextConfig
