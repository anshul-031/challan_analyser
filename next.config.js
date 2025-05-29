/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true
  },
  // Minimal production settings
  productionBrowserSourceMaps: true,
  poweredByHeader: false,
  reactStrictMode: false,
};

module.exports = nextConfig;
