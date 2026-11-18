import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "trycloudflare.com",
  ],
  experimental: {
    agentUpgrade: "security",
    serverActions: {
      allowedOrigins: [
        "*.trycloudflare.com",
        "trycloudflare.com",
      ],
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
