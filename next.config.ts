import type { NextConfig } from "next";
import path from "path";

const projectRoot = path.resolve(process.cwd());

const nextConfig: NextConfig = {
  // This repo sits under a huge Desktop tree. Without an explicit root,
  // Next/Turbopack walks parent folders and startup takes minutes.
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  devIndicators: false,
};

export default nextConfig;
