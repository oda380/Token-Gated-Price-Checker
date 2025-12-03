/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // eslint config moved to eslint.config.mjs in Next.js 16
  serverExternalPackages: [
    '@metamask/sdk',
    '@metamask/sdk-communication-layer',
    '@react-native-async-storage/async-storage',
    'wagmi',
    '@wagmi/connectors',
    '@wagmi/core',
  ],
  // Explicitly set turbopack to empty object to silence warning
  turbopack: {},
};

module.exports = nextConfig;