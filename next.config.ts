import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/landongpt', destination: '/landongpt' },
      { source: '/landongpt2', destination: '/landongpt' },
      { source: '/landonGPT', destination: '/landongpt' },
      { source: '/LandonGPT', destination: '/landongpt' },
      { source: '/LandonGPT2', destination: '/landongpt' },
    ];
  },
};

export default nextConfig;
