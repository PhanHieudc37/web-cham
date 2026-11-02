"use server";
import { refreshAdminPaths } from "@/server/admin-refresh";

import { warmCatalog } from "@/server/warming";
import { z } from "zod";
import { idSchema } from "@/lib/validation/common";
import { productInputSchema, sizeChartInputSchema } from "@/lib/validation/product";
import { requireRole } from "@/server/auth/guards";
import { CACHE_TAGS, invalidate, warmPaths } from "@/server/cache";
import { runAction } from "@/server/run-action";
import { getProductService } from "@/server/services/product.service";

export async function saveProductAction(input: unknown) {
  return runAction(async () => { const values = productInputSchema.parse(input); const actor = await requireRole("staff"); const service = getProductService(); const result = await service.save(values, actor.id); invalidate(CACHE_TAGS.products, CACHE_TAGS.categories, CACHE_TAGS.collections); refreshAdminPaths(["/admin", "/admin/products", "/admin/products/[id]", "/admin/products/new"]); warmCatalog("product", result.id); return { ...result, product: await service.get(result.id) }; });
}
export async function duplicateProductAction(input: unknown) {
  return runAction(async () => { const { id } = z.object({ id: idSchema }).parse(input); const actor = await requireRole("staff"); const result = await getProductService().duplicate(id, actor.id); invalidate(CACHE_TAGS.products); refreshAdminPaths(["/admin", "/admin/products", "/admin/products/[id]", "/admin/products/new"]); warmPaths(["/"]); return result; });
}
export async function setProductStatusAction(input: unknown) {
  return runAction(async () => { const { id, status } = z.object({ id: idSchema, status: z.enum(["draft", "active", "archived"]) }).parse(input); const actor = await requireRole("staff"); const result = await getProductService().setStatus(id, status, actor.id); invalidate(CACHE_TAGS.products, CACHE_TAGS.categories); refreshAdminPaths(["/admin", "/admin/products", "/admin/products/[id]"]); warmCatalog("product", id); return result; });
}
export async function createSizeChartAction(input: unknown) {
  return runAction(async () => { const values = sizeChartInputSchema.parse(input); await requireRole("staff"); const result = await getProductService().createSizeChart(values); invalidate(CACHE_TAGS.products); refreshAdminPaths(["/admin", "/admin/products", "/admin/products/[id]", "/admin/products/new"]); warmPaths(["/"]); return result; });
}
