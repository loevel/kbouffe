import type { NextConfig } from "next";
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

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {},
  // tesseract.js est un module CommonJS — Next.js doit le transpiler
  transpilePackages: ["tesseract.js"],
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
