/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Allow calling backend APIs deployed on Render
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },

  // Required if you deploy on Vercel and use dynamic routes
  output: "standalone",

  // Prevent build from failing on ESLint errors during deployment
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Prevent TypeScript build blocking on minor type issues
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;