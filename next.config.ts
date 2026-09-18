import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-1813fa24f4b74f44896e886714f409db.r2.dev",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
