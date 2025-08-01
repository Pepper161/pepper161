/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Vercel deployment (for now, disable for development)
  // output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  async rewrites() {
    // 開発環境でのみプロキシを有効化
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
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  }
}

module.exports = nextConfig