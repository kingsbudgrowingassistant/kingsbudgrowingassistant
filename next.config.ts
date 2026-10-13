import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No output: "standalone" — Netlify's @netlify/plugin-nextjs handles
  // SSR/SSG automatically. Vercel also works with this config (it auto-detects
  // Next.js). For Vercel-specific standalone builds, use `npm run build:vercel`.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
