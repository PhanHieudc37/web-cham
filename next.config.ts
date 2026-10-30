import type { NextConfig } from "next";
import { PHASE_PRODUCTION_SERVER } from "next/constants";
import { localEnvSchema, parseEnvironment, serverEnvSchema } from "./src/lib/validation/env";

export default function nextConfig(phase: string): NextConfig {
  const env = parseEnvironment(localEnvSchema, process.env);
  // Production startup validates all providers; the storefront build reads PostgreSQL.
  if (phase === PHASE_PRODUCTION_SERVER) {
    parseEnvironment(serverEnvSchema, process.env);
  }
  return {
    poweredByHeader: false,
    // Limit prerender workers so concurrent pages do not exhaust the shared Postgres pool.
    experimental: { cpus: 2, staticGenerationMaxConcurrency: 2 },
    // Checkout action arguments contain personal data; success URLs carry bearer tokens.
    logging: { serverFunctions: false, incomingRequests: false, browserToTerminal: false },
    turbopack: {
      rules: {
        "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
      },
    },
    images: {
      remotePatterns: env.SUPABASE_URL
        ? [new URL("/storage/v1/object/public/**", env.SUPABASE_URL)]
        : [],
    },
    headers() {
      const privateRoutes = ["/admin/:path*", "/checkout/:path*", "/cart", "/kiem-tra-don-hang", "/api/:path*"];
      return [{
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      }, ...privateRoutes.map((source) => ({ source, headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }))];
    },
  };
}
