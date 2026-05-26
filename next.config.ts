import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["sharp", "heic-convert", "pdfjs-dist", "@napi-rs/canvas"],
  images: {
    localPatterns: [
      { pathname: "/media/**" },
      { pathname: "/brand/**" },
      { pathname: "/logo.png" },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },
  async rewrites() {
    return [
      {
        source: "/media/.curated/:path*",
        destination: "/media/curated/:path*",
      },
    ];
  },
};

export default nextConfig;
