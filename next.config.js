const nextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups', // Fixes internal errors with some wallets
          },
        ],
      },
    ]
  },
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@react-native-async-storage/async-storage': require('path').resolve(
        __dirname,
        'src/shims/asyncStorage.ts'
      ),
    }
    return config
  },
}

module.exports = nextConfig