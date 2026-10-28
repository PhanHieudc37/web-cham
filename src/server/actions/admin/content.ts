"use server";
import { z } from "zod";
import { idSchema } from "@/lib/validation/common";
import { collectionInputSchema } from "@/lib/validation/collection";
import { bannerInputSchema } from "@/lib/validation/banner";
import { requireRole } from "@/server/auth/guards";
import { CACHE_TAGS, invalidate } from "@/server/cache";
import { runAction } from "@/server/run-action";
import { getContentService } from "@/server/services/content.service";
export async function saveCollectionAction(input: unknown) { return runAction(async () => { const values = collectionInputSchema.parse(input); await requireRole("staff"); const service = getContentService(); const result = await service.saveCollection(values); invalidate(CACHE_TAGS.collections, CACHE_TAGS.products); return { ...result, collection: (await service.listCollections()).find((row) => row.id === result.id) }; }); }
export async function deleteCollectionAction(input: unknown) { return runAction(async () => { const { id } = z.object({ id: idSchema }).parse(input); await requireRole("staff"); const result = await getContentService().deleteCollection(id); invalidate(CACHE_TAGS.collections, CACHE_TAGS.products); return result; }); }
export async function saveBannerAction(input: unknown) { return runAction(async () => { const values = bannerInputSchema.parse(input); await requireRole("staff"); const result = await getContentService().saveBanner(values); invalidate(CACHE_TAGS.banners); return result; }); }
export async function deleteBannerAction(input: unknown) { return runAction(async () => { const { id } = z.object({ id: idSchema }).parse(input); await requireRole("staff"); const result = await getContentService().deleteBanner(id); invalidate(CACHE_TAGS.banners); return result; }); }
export async function reorderContentAction(input: unknown) { return runAction(async () => { const values = z.object({ id: idSchema, kind: z.enum(["collections", "banners"]), direction: z.enum(["up", "down"]) }).parse(input); await requireRole("staff"); const result = await getContentService().reorder(values.kind, values.id, values.direction); invalidate(CACHE_TAGS[values.kind]); return result; }); }
export async function findCollectionProductsAction(input: unknown) { return runAction(async () => { const values = z.object({ query: z.string().max(100).default(""), ids: z.array(idSchema).max(500).default([]), page: z.number().int().positive().default(1) }).parse(input); await requireRole("staff"); return getContentService().productChoices(values.query, values.ids, values.page); }); }
