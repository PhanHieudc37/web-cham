import "server-only";

import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDatabase } from "@/server/db/client";
import { categories, collections, collectionProducts, products, productVariants } from "@/server/db/schema";

export type WarmKind = "product" | "category" | "collection" | "variant";
export async function getPublicWarmPaths(kind: WarmKind, id: string): Promise<string[]> {
  const db = getDatabase();
  const common = ["/", "/collections/all", "/collections/new-arrival", "/collections/best-seller", "/collections/sale", "/search-index.json"];
  if (kind === "variant") {
    const [variant] = await db.select({ productId: productVariants.productId }).from(productVariants).where(eq(productVariants.id, id));
    return variant ? getPublicWarmPaths("product", variant.productId) : common;
  }
  if (kind === "collection") {
    const [collection] = await db.select({ slug: collections.slug, active: collections.isActive }).from(collections).where(eq(collections.id, id));
    return collection?.active ? ["/", `/collections/${collection.slug}`, ...common] : common;
  }
  const parent = alias(categories, "warm_parent");
  if (kind === "category") {
    const [category] = await db.select({ slug: categories.slug, active: categories.isActive, parentSlug: parent.slug }).from(categories).leftJoin(parent, eq(categories.parentId, parent.id)).where(eq(categories.id, id));
    return category?.active ? ["/", `/collections/${category.slug}`, ...(category.parentSlug ? [`/collections/${category.parentSlug}`] : []), ...common] : common;
  }
  const rows = await db.select({ slug: products.slug, status: products.status, category: categories.slug, parent: parent.slug, collection: collections.slug }).from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id)).leftJoin(parent, eq(categories.parentId, parent.id))
    .leftJoin(collectionProducts, eq(collectionProducts.productId, products.id)).leftJoin(collections, eq(collections.id, collectionProducts.collectionId)).where(eq(products.id, id));
  const product = rows[0];
  if (!product || product.status !== "active") return common;
  return ["/", `/products/${product.slug}`, `/collections/${product.category}`, ...(product.parent ? [`/collections/${product.parent}`] : []), ...common,
    ...rows.flatMap((row) => row.collection ? [`/collections/${row.collection}`] : [])];
}
