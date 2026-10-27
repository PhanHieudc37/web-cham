import type { NextConfig } from "next";
import { PHASE_PRODUCTION_SERVER } from "next/constants";
import { localEnvSchema, parseEnvironment, serverEnvSchema } from "./src/lib/validation/env";

export default function nextConfig(phase: string): NextConfig {
  const env = parseEnvironment(localEnvSchema, process.env);
  // Building the Phase 0 shell needs no external service. Production startup does.
  if (phase === PHASE_PRODUCTION_SERVER) {
    parseEnvironment(serverEnvSchema, process.env);
  }
  return {
    poweredByHeader: false,
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
      return [{
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      }];
    },
  };
}
