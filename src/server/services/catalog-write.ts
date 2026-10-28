import "server-only";

import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { RESERVED_COLLECTION_SLUGS } from "@/lib/constants";
import { normalizeVietnamese } from "@/lib/normalize";
import { uniqueSlug } from "@/lib/slug";
import type { DatabaseReader } from "@/server/db/client";
import { categories, collections, productColors, products } from "@/server/db/schema";
import { AppError } from "@/server/errors";

export async function lockCatalog(reader: DatabaseReader) { await reader.execute(sql`SELECT pg_advisory_xact_lock(726039)`); }
export async function catalogSlug(reader: DatabaseReader, name: string, supplied: string | undefined, kind: "category" | "collection" | "product", id?: string) {
  async function exists(slug: string) {
    if (kind === "product") return (await reader.select({ id: products.id }).from(products).where(and(eq(products.slug, slug), id ? ne(products.id, id) : undefined)).limit(1)).length > 0;
    if ((RESERVED_COLLECTION_SLUGS as readonly string[]).includes(slug)) return true;
    const [category, collection] = await Promise.all([
      reader.select({ id: categories.id }).from(categories).where(and(eq(categories.slug, slug), id && kind === "category" ? ne(categories.id, id) : undefined)).limit(1),
      reader.select({ id: collections.id }).from(collections).where(and(eq(collections.slug, slug), id && kind === "collection" ? ne(collections.id, id) : undefined)).limit(1),
    ]);
    return category.length > 0 || collection.length > 0;
  }
  if (supplied) {
    if (await exists(supplied)) throw new AppError("CONFLICT", "Đường dẫn đã được sử dụng hoặc dành riêng.", undefined, { slug: "Đường dẫn đã được sử dụng hoặc dành riêng" });
    return supplied;
  }
  return uniqueSlug(name, exists);
}
const parent = alias(categories, "search_parent");
export async function refreshSearchText(reader: DatabaseReader, ids: string[]) {
  if (!ids.length) return;
  const rows = await reader.select({ id: products.id, name: products.name, code: products.code, category: categories.name, parent: parent.name,
    colors: sql<string>`coalesce(string_agg(${productColors.name}, ' '), '')` }).from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id)).leftJoin(parent, eq(categories.parentId, parent.id)).leftJoin(productColors, eq(productColors.productId, products.id))
    .where(inArray(products.id, ids)).groupBy(products.id, categories.name, parent.name);
  for (const row of rows) await reader.update(products).set({ searchText: normalizeVietnamese([row.name, row.code, row.category, row.parent, row.colors].filter(Boolean).join(" ")) }).where(eq(products.id, row.id));
}
