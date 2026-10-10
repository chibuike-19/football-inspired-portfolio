import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site (SPEC §4): deployable to any static host.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    // Pin the root: a pnpm lockfile in the home directory otherwise confuses root detection.
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
