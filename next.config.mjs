/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Production performance tuning.
  productionBrowserSourceMaps: false, // don't ship source maps to browsers
  compress: true, // gzip responses (on by default, explicit for clarity)

  // Ensure the Prisma query engine + schema are copied into the serverless
  // function bundle on Vercel. Next.js traces JS imports but does NOT copy the
  // native `.so.node` engine on its own; DB calls run from server actions on
  // page routes too, so include the .prisma output across all routes.
  outputFileTracingIncludes: {
    "/**/*": [
      "./node_modules/.prisma/client/**",
      "./prisma/schema.prisma",
    ],
  },

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
