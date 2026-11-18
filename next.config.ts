import type { NextConfig } from "next";

/** Old service URLs (pre-redesign) → closest current page, so existing links don't 404. */
const OLD_SERVICE_SLUGS = [
  "yard-landscape",
  "move-out-cleaning",
  "trash-debris-removal",
  "window-cleaning",
  "residential-cleaning",
  "commercial-cleaning",
  "pressure-washing",
  "auto-detailing",
  "carpet-steam-cleaning",
  "trash-can-cleaning",
  "airbnb-services",
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["sharp", "heic-convert", "pdfjs-dist", "@napi-rs/canvas"],
  images: {
    localPatterns: [
      { pathname: "/media/**" },
      { pathname: "/brand/**" },
      { pathname: "/site/**" },
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
      { source: "/pricing", destination: "/quote", permanent: true },
      { source: "/services/property-maintenance", destination: "/services/handyman", permanent: true },
      ...OLD_SERVICE_SLUGS.map((slug) => ({
        source: `/services/${slug}`,
        destination: "/services/vendor-coordination",
        permanent: true,
      })),
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
        source: "/site/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
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
