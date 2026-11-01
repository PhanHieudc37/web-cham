import "server-only";

import { and, eq, isNull, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { discountPercent } from "@/lib/domain/pricing";
import { defaultSettings } from "@/lib/validation/settings";
import type { ProductAvailabilityDTO } from "@/types/dto";
import { getDatabase, type DatabaseReader } from "@/server/db/client";
import { categories, products, settings } from "@/server/db/schema";
import { AppError } from "@/server/errors";

const parent = alias(categories, "availability_parent");
export async function getProductAvailability(id: string, reader: DatabaseReader = getDatabase()): Promise<ProductAvailabilityDTO> {
  const [product] = await reader.select({ price: products.price, compareAtPrice: products.compareAtPrice,
    variants: sql<ProductAvailabilityDTO["variants"]>`coalesce((select jsonb_agg(jsonb_build_object(
      'id', v.id, 'colorId', v.color_id, 'size', v.size, 'sku', v.sku,
      'available', v.is_active and v.stock > 0,
      'maxQuantity', case when v.is_active then least(v.stock, coalesce((${settings.value}->>'maxQtyPerLine')::integer, ${defaultSettings.orders.maxQtyPerLine})) else 0 end,
      'lowStockCount', case when v.is_active and v.stock > 0 and v.stock <= coalesce((${settings.value}->>'lowStockThreshold')::integer, ${defaultSettings.orders.lowStockThreshold}) then v.stock else null end
    ) order by v.id) from product_variants v where v.product_id = ${products.id}), '[]'::jsonb)` })
    .from(products).innerJoin(categories, eq(products.categoryId, categories.id)).leftJoin(parent, eq(categories.parentId, parent.id)).leftJoin(settings, eq(settings.key, "orders"))
    .where(and(eq(products.id, id), eq(products.status, "active"), eq(categories.isActive, true), or(isNull(parent.id), eq(parent.isActive, true))));
  if (!product) throw new AppError("NOT_FOUND");
  return { ...product, discountPercent: discountPercent(product.price, product.compareAtPrice), isSoldOut: !product.variants.some((variant) => variant.available) };
}
