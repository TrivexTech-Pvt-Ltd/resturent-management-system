import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/remote-api/:path*',
        destination: 'http://resturentsystem.runasp.net/api/:path*',
      },
    ];
  },
};

export default nextConfig;
