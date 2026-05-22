import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "192.168.88.246",
    "192.168.88.*",
    "192.168.1.*",
    "192.168.0.*",
    "10.0.*.*",
  ],
};

export default nextConfig;
