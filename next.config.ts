import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@duckdb/node-api'],
  logging: {
    browserToTerminal: false,
  },
};

export default nextConfig;
