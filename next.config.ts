import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/**": ["./data/*.json"],
  },
  allowedDevOrigins: ["192.168.1.52"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.mzstatic.com" },
    ],
  },
};

export default nextConfig;
