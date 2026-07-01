import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  /** Avoid ChunkLoadError when first compile is slow in dev (large app graph). */
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.output = config.output ?? {};
      config.output.chunkLoadTimeout = 120_000;
    }
    return config;
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "image.thum.io",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
