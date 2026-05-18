/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdf-parse uses Node-specific APIs; keep server externals to avoid bundling issues
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "mammoth"],
  },
  webpack: (config) => {
    // Avoid attempting to bundle pdf-parse test fixtures
    config.module.rules.push({
      test: /node_modules\/pdf-parse\/.*\.pdf$/,
      type: "asset/resource",
    });
    return config;
  },
};

export default nextConfig;
