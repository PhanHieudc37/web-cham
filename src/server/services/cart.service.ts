import "server-only";

import { asc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { calculatePricing } from "@/lib/domain/pricing";
import type { CartLineInput } from "@/lib/validation/checkout";
import type { Settings } from "@/lib/validation/settings";
import type { CartQuoteDTO } from "@/types/dto";
import { AppError } from "@/server/errors";
import { getDatabase, type DatabaseReader } from "@/server/db/client";
import { categories, productColors, productImages, products, productVariants } from "@/server/db/schema";
import { readSettings } from "./settings.service";

const parentCategory = alias(categories, "cart_parent_category");
export async function loadCartRows(reader: DatabaseReader, variantIds: string[], lock = false) {
  if (!variantIds.length) return [];
  const query = reader.select({
    variantId: productVariants.id, productId: products.id, slug: products.slug, name: products.name, colorId: productColors.id,
    colorName: productColors.name, size: productVariants.size, sku: productVariants.sku, unitPrice: products.price, compareAtPrice: products.compareAtPrice,
    stock: productVariants.stock, variantActive: productVariants.isActive, productStatus: products.status, categoryActive: categories.isActive, parentActive: parentCategory.isActive,
  }).from(productVariants).innerJoin(products, eq(productVariants.productId, products.id))
    .innerJoin(productColors, eq(productVariants.colorId, productColors.id)).innerJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(parentCategory, eq(categories.parentId, parentCategory.id)).where(inArray(productVariants.id, variantIds)).orderBy(asc(productVariants.id)).$dynamic();
  return lock ? query.for("update", { of: productVariants }) : query;
}
export type CartRows = Awaited<ReturnType<typeof loadCartRows>>;
export const cartRowAvailable = (row: CartRows[number]) => row.variantActive && row.productStatus === "active" && row.categoryActive && row.parentActive !== false;

export async function buildCartQuote(reader: DatabaseReader, requested: CartLineInput[], config: Settings, rows: CartRows): Promise<CartQuoteDTO> {
  const productIds = [...new Set(rows.map((row) => row.productId))];
  const images = productIds.length ? await reader.select().from(productImages).where(inArray(productImages.productId, productIds)).orderBy(asc(productImages.sortOrder)) : [];
  const lines: CartQuoteDTO["lines"] = requested.map((line) => {
    const row = rows.find((item) => item.variantId === line.variantId);
    if (!row) return { variantId: line.variantId, productId: "", slug: "", name: "Sản phẩm đã ngừng bán", colorName: "", size: "", image: null, unitPrice: 0, compareAtPrice: null, requestedQuantity: line.quantity, quantity: 0, maxQuantity: 0, lineTotal: 0, issue: "UNAVAILABLE" };
    const available = cartRowAvailable(row);
    const maxQuantity = available ? Math.min(row.stock, config.orders.maxQtyPerLine) : 0;
    const quantity = Math.min(line.quantity, maxQuantity);
    const candidates = images.filter((image) => image.productId === row.productId);
    const image = candidates.find((item) => item.colorId === row.colorId) ?? candidates.find((item) => item.colorId === null) ?? candidates[0];
    return {
      variantId: row.variantId, productId: row.productId, slug: row.slug, name: row.name, colorName: row.colorName, size: row.size,
      image: image ? { url: image.url, alt: image.alt } : null, unitPrice: row.unitPrice, compareAtPrice: row.compareAtPrice,
      requestedQuantity: line.quantity, quantity, maxQuantity, lineTotal: row.unitPrice * quantity,
      issue: !available ? "UNAVAILABLE" : row.stock === 0 ? "OUT_OF_STOCK" : quantity < line.quantity ? "QUANTITY_REDUCED" : null,
    };
  });
  try { return { lines, ...calculatePricing(lines, config.shipping), discount: null }; }
  catch (error) { if (error instanceof RangeError) throw new AppError("VALIDATION_ERROR", error.message); throw error; }
}
export async function quoteCart(lines: CartLineInput[], reader: DatabaseReader = getDatabase()): Promise<CartQuoteDTO> {
  const [config, rows] = await Promise.all([readSettings(reader), loadCartRows(reader, lines.map((line) => line.variantId))]);
  return buildCartQuote(reader, lines, config, rows);
}
