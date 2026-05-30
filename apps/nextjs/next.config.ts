import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@incident-agent/shared",
    "@incident-agent/integrations",
    "@incident-agent/memory",
    "@incident-agent/agents",
  ],
};

export default nextConfig;
