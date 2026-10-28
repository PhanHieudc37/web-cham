import "server-only";

import { createHash } from "node:crypto";
import { revalidateTag, unstable_cache } from "next/cache";
import { getDatabaseEnv } from "./env";
export const CACHE_TAGS = { products: "products", categories: "categories", collections: "collections", banners: "banners", settings: "settings" } as const;
export function cached<Args extends unknown[], Value>(fn: (...args: Args) => Promise<Value>, keyParts: string[], tags: string[]) {
  return (...args: Args): Promise<Value> => {
    const connection = new URL(getDatabaseEnv().DATABASE_URL);
    // Next's disk cache survives restarts: keep test and shop data separate.
    // The pooler username identifies a Supabase project; exclude its password.
    const namespace = createHash("sha256").update([connection.host, connection.pathname, connection.username].join("|")).digest("hex");
    return unstable_cache(fn, [namespace, ...keyParts], { tags, revalidate: 300 })(...args);
  };
}
export function invalidate(...tags: string[]) { for (const tag of tags) revalidateTag(tag, { expire: 0 }); }
