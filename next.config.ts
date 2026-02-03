import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/gmahkbsd-next",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
