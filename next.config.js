/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: false,
  },
  // Для Docker builds
  output: 'standalone',
  
  // Настройки для работы с внешними API
  async rewrites() {
    return []
  },

  // Настройки заголовков
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ]
  },

  // Переменные окружения доступные на клиенте
  env: {
    NEXT_PUBLIC_POLL_INTERVAL_MS: process.env.SLETAT_POLL_INTERVAL_MS || '1500',
    NEXT_PUBLIC_POLL_TIMEOUT_MS: process.env.SLETAT_POLL_TIMEOUT_MS || '20000',
  }
}

module.exports = nextConfig