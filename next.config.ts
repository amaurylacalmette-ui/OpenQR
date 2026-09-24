import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Some reverse proxies (e.g. Aliyun FC gateways) 301 "/dashboard" to
  // "/dashboard/" while Next.js would 308 it back — an infinite redirect
  // loop. Skip Next's automatic trailing-slash redirect so slashed paths
  // render directly; middleware treats them as the same route.
  skipTrailingSlashRedirect: true,
  experimental: {
    serverActions: {
      // Accept Server Action POSTs whose Origin differs from the forwarded
      // Host (sandbox preview proxies, local dev ports). Keep this list in
      // sync with the domains the app is actually reached through.
      // If you reach the app through a proxy that rewrites the Host header
      // (CDN, tunnel, PaaS preview), add your public origin here, e.g.
      // "qr.example.com". See README troubleshooting.
      allowedOrigins: ["localhost:3000", "127.0.0.1:3000"],
    },
  },
};

export default nextConfig;
