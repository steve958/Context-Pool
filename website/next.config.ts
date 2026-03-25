import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",        // static export — deploy to GitHub Pages, Vercel, Netlify, S3
  trailingSlash: true,
};

export default nextConfig;
