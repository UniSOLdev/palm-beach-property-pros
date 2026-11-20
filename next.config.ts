import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["sharp", "heic-convert", "pdfjs-dist", "@napi-rs/canvas"],
  images: {
    localPatterns: [
      { pathname: "/media/**" },
      { pathname: "/brand/**" },
      { pathname: "/photos/**" },
      { pathname: "/logo.png" },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async rewrites() {
    return [
      {
        source: "/media/.curated/:path*",
        destination: "/media/curated/:path*",
      },
    ];
  },
  async redirects() {
    return [
      { source: "/contact", destination: "/quote", permanent: true },
      // The Dive moved to the homepage (Nov 2026).
      { source: "/the-dive", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        // Hero frames live under a versioned folder, so they can be cached forever.
        source: "/hero/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // The Dive / drag-to-spin frames: also versioned (/experiences/<name>/<version>/...).
        source: "/experiences/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/photos/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
      {
        // Keep *.vercel.app copies (production alias + previews) out of Google:
        // only www.palmbeachpropertypros.com should be indexed.
        source: "/:path*",
        has: [{ type: "host", value: "(?<host>.*\\.vercel\\.app)" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
