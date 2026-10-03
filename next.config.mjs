/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  turbopack: {
    root: import.meta.dirname,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/product/:slug', destination: '/products/:slug', permanent: true },
      { source: '/resources/help', destination: '/help-center', permanent: true },
      { source: '/resources/blog', destination: '/blog', permanent: true },
      { source: '/resources/blog/:slug', destination: '/blog/:slug', permanent: true },
      { source: '/industry/:slug', destination: '/solutions/:slug', permanent: false },
      { source: '/user/register', destination: '/register', permanent: false },
      { source: '/user/login', destination: '/login', permanent: false },
      { source: '/founders', destination: '/about', permanent: true },
      { source: '/blog/author/saurabh-singh', destination: '/blog/author/leadforgrow-team', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/((?!chatbot-iframe).*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/chatbot-iframe',
        headers: [
          { key: 'Content-Security-Policy', value: 'frame-ancestors *' },
        ],
      },
    ];
  },
};

export default nextConfig;
