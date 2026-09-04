/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Production performance tuning.
  productionBrowserSourceMaps: false, // don't ship source maps to browsers
  compress: true, // gzip responses (on by default, explicit for clarity)

  // Tree-shake large icon/lib barrels aggressively to shrink first-load JS.
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@prisma/client",
    ],
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
