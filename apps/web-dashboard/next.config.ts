import type { NextConfig } from "next";
import path from "path";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import withPWAInit from "@ducanh2912/next-pwa";

if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development", // Optional: disable PWA in dev
  workboxOptions: {
    disableDevLogs: true,
  },
});

const FRAMER_STUB = path.resolve("./stubs/framer-motion-stub.js");
const FRAMER_REAL = path.resolve("./node_modules/framer-motion/dist/es/index.mjs");

const nextConfig: NextConfig = {
  reactCompiler: true,
  /**
   * Replace framer-motion with a no-op stub in all bundles (client + server).
   * framer-motion is ~260 KB raw in SSR chunks — removing it saves ~86 KB gzip.
   * Animations are disabled visually but layout/functionality is preserved.
   * Required to stay under Cloudflare Workers 3 MiB free plan limit.
   */
  turbopack: {
    resolveAlias: {
      "framer-motion": "./stubs/framer-motion-stub.js",
      "framer-motion/m": "./stubs/framer-motion-stub.js",
      "framer-motion/dom": "./stubs/framer-motion-stub.js",
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  // Webpack alias kept as fallback (not used if Turbopack is active)
  webpack(config, { isServer }) {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "framer-motion": FRAMER_STUB,
        "framer-motion/m": FRAMER_STUB,
        "framer-motion/dom": FRAMER_STUB,
      };
    }
    return config;
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: "/api/:path*",
          destination: `${process.env.NEXT_PUBLIC_API_WORKER_URL ?? "http://localhost:8787"}/api/:path*`,
        },
      ],
    };
  },
};

export default withPWA(nextConfig);
