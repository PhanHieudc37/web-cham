"use server";

import { z } from "zod";
import { categoryInputSchema } from "@/lib/validation/category";
import { idSchema } from "@/lib/validation/common";
import { requireRole } from "@/server/auth/guards";
import { CACHE_TAGS, invalidate } from "@/server/cache";
import { runAction } from "@/server/run-action";
import { getCategoryService } from "@/server/services/category.service";

function refresh() { invalidate(CACHE_TAGS.categories, CACHE_TAGS.products); }
export async function saveCategoryAction(input: unknown) {
  return runAction(async () => { const values = categoryInputSchema.parse(input); await requireRole("staff"); const result = await getCategoryService().save(values); refresh(); return result; });
}
export async function deleteCategoryAction(input: unknown) {
  return runAction(async () => { const { id } = z.object({ id: idSchema }).parse(input); await requireRole("staff"); const result = await getCategoryService().remove(id); refresh(); return result; });
}
export async function reorderCategoryAction(input: unknown) {
  return runAction(async () => { const { id, direction } = z.object({ id: idSchema, direction: z.enum(["up", "down"]) }).parse(input); await requireRole("staff"); const result = await getCategoryService().reorder(id, direction); refresh(); return result; });
}
export async function setCategoryVisibilityAction(input: unknown) {
  return runAction(async () => { const { id, active } = z.object({ id: idSchema, active: z.boolean() }).parse(input); await requireRole("staff"); const result = await getCategoryService().setVisibility(id, active); refresh(); return result; });
}
