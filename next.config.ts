import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable static export during development for better HMR stability
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Ensure DuckDB binaries are not handled by the Next.js server bundler
  serverExternalPackages: ["@duckdb/duckdb-wasm"],
  // Optimize for Windows HMR stability
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        aggregateTimeout: 300,
        poll: 1000,
      };
    }
    return config;
  },
};

export default nextConfig;
