import type { NextConfig } from "next";

// The base path for deployment (e.g. "/gmahkbsd-next" for GitHub Pages).
// Set NEXT_PUBLIC_BASE_PATH in your environment / CI to your repo name.
// Leave unset for a root-hosted deployment.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
