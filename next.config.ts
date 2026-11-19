import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No "X-Powered-By: Next.js": it only tells scanners what to try.
  poweredByHeader: false,
  output: "standalone",
  // createFileDisImport reads a directory chosen at run time (DIS_IMPORT_DIR, local imports
  // only), so the build's file tracing copied the whole project into the standalone server:
  // TypeScript sources, deploy scripts, migrations, docs. The server needs none of them
  // (deploy/smoke.py checks that /app/src is absent from the web image).
  outputFileTracingExcludes: {
    "**": [
      "./src/**/*",
      "./deploy/**/*",
      "./docs/**/*",
      "./scripts/**/*",
      "./supabase/**/*",
      "./tests/**/*",
      "./*.{md,ts,mjs,yaml,yml,toml,tsbuildinfo}",
      "./{knip,renovate,tsconfig,site.config}.json",
      "./Dockerfile",
    ],
  },
  typescript: {
    ignoreBuildErrors: process.env.DOCKER_BUILD === "1",
  },
  // The Content Security Policy (frame-ancestors included) is set per request by src/proxy.ts,
  // with a fresh nonce for pages and a sandbox for /api.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
