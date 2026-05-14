import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // Common mistaken URLs (no dedicated pages in this app — dashboard lives at /admin).
      { source: "/admin/dashboard", destination: "/admin", permanent: true },
      // Temporary until a real sign-in flow exists; avoids hard 404s if a proxy or bookmark hits /admin/login.
      { source: "/admin/login", destination: "/admin", permanent: false },
    ];
  },
};

export default nextConfig;
