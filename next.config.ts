import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully static site (SPEC §4): deployable to any static host.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // Always defined so the debug camera (world/World.tsx) is compiled out of normal builds.
  env: { NEXT_PUBLIC_WORLD_DEBUG: process.env.NEXT_PUBLIC_WORLD_DEBUG ?? "0" },
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
