import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep local development and production verification artifacts isolated.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
