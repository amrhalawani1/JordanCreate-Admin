import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This repo sits under a huge Desktop tree. Without an explicit root,
  // Next/Turbopack walks parent folders and startup takes minutes.
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  devIndicators: false,
  experimental: {
    serverActions: {
      // Photo uploads go through a server action (actions/upload-media.ts,
      // 5 MB max). The default 1 MB limit made larger photos fail with no
      // response, so the picker sat on "Uploading…" forever.
      bodySizeLimit: "6mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
