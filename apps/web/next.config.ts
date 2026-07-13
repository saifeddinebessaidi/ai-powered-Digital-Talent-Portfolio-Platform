import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Monorepo: node_modules and the lockfile are hoisted to the repo root.
  // Pin Turbopack's workspace root there so it doesn't mis-infer it (which
  // otherwise crashes the dev server on recompile).
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
};

export default nextConfig;
