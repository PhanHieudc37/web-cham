import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";
export const CACHE_TAGS = { products: "products", categories: "categories", collections: "collections", banners: "banners", settings: "settings" } as const;
export function cached<Args extends unknown[], Value>(fn: (...args: Args) => Promise<Value>, keyParts: string[], tags: string[]) {
  return unstable_cache(fn, keyParts, { tags, revalidate: 300 });
}
export function invalidate(...tags: string[]) { for (const tag of tags) revalidateTag(tag, { expire: 0 }); }
