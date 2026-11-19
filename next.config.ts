import type { NextConfig } from "next";

const scriptSrc =
  process.env.NODE_ENV === "production"
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

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
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              scriptSrc,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data:",
              "font-src 'self'",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
