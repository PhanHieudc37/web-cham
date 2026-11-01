import "server-only";

import { createHash } from "node:crypto";
import { revalidateTag, unstable_cache } from "next/cache";
import { after } from "next/server";
import { getDatabaseEnv } from "./env";
export const CACHE_TAGS = { products: "products", categories: "categories", collections: "collections", banners: "banners", settings: "settings" } as const;
export function cached<Args extends unknown[], Value>(fn: (...args: Args) => Promise<Value>, keyParts: string[], tags: string[], revalidate = 86400) {
  return (...args: Args): Promise<Value> => {
    const connection = new URL(getDatabaseEnv().DATABASE_URL);
    // Next's disk cache survives restarts: keep test and shop data separate.
    // The pooler username identifies a Supabase project; exclude its password.
    const namespace = createHash("sha256").update([connection.host, connection.pathname, connection.username].join("|")).digest("hex");
    return unstable_cache(fn, [namespace, ...keyParts], { tags, revalidate })(...args);
  };
}
export function invalidate(...tags: string[]) { for (const tag of tags) revalidateTag(tag, { expire: 0 }); }
export function warmPaths(paths: string[]) {
  const allowed = [...new Set(paths)].filter((path) => /^\/(?:$|products\/[a-z0-9-]+$|collections\/[a-z0-9-]+$|search-index\.json$)/.test(path)).slice(0, 10);
  if (!allowed.length) return;
  after(async () => {
    const origin = process.env.NEXT_PUBLIC_SITE_URL;
    if (!origin) return;
    // Sequential and bounded: one background task must fit the function's lifetime.
    const deadline = Date.now() + 45000;
    for (const path of allowed) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      try {
        const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(Math.min(10000, remaining)), redirect: "error" });
        await response.arrayBuffer();
        if (!response.ok) console.warn("[cache] Public warm request failed", { status: response.status });
      } catch { console.warn("[cache] Public warm request failed"); }
    }
  });
}
