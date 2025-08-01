/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // 本番環境では外部APIへのプロキシは無効
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:4111/api/:path*',
        },
      ]
    }
    return []
  },
  // Static export for Vercel deployment
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig