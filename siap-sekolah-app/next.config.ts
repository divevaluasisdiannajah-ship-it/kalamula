import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Cloudflare Pages compatibility */
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
