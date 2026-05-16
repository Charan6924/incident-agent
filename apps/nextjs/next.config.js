/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@incident-agent/shared", "@incident-agent/integrations"],
};

module.exports = nextConfig;
