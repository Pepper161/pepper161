/** @type {import('next').NextConfig} */
const nextConfig = {
  // Redirect all requests to next-client directory
  async redirects() {
    return [
      {
        source: '/((?!next-client).*)',
        destination: '/next-client/:path*',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;