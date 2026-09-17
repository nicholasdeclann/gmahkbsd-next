import type { NextConfig } from "next";

// The base path for deployment (e.g. "/gmahkbsd-next" for GitHub Pages).
// Set NEXT_PUBLIC_BASE_PATH in your environment / CI to your repo name.
// Leave unset for a root-hosted deployment (e.g. Vercel).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// GitHub Pages needs a fully static export; Vercel runs Next.js natively and
// gets image optimization for free. Set STATIC_EXPORT=true in the GitHub Pages
// workflow; leave it unset on Vercel.
const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  ...(isStaticExport ? { output: "export" } : {}),
  basePath,
  poweredByHeader: false,
  images: {
    // Next.js image optimization requires a server, which a static export
    // does not have. On Vercel this stays enabled for WebP/AVIF + srcsets.
    unoptimized: isStaticExport,
  },
  experimental: {
    optimizePackageImports: [
      "@mui/material",
      "@mui/icons-material",
      "@emotion/react",
      "@emotion/styled",
    ],
  },
};

export default nextConfig;
