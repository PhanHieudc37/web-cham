import "server-only";
import { asc, count, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import type { BannerAdminDTO, BannerInput, CollectionAdminDTO, CollectionInput, ProductChoiceDTO } from "@/types/content-admin";
import { normalizeVietnamese } from "@/lib/normalize";
import { getDatabase, type Database } from "@/server/db/client";
import { banners, collectionProducts, collections, products } from "@/server/db/schema";
import { AppError } from "@/server/errors";
import { catalogSlug, lockCatalog } from "./catalog-write";
import { assertStoredMedia, removeUnusedMedia } from "./media.service";

export function createContentService(db: Database, removeMedia = removeUnusedMedia) {
  async function listCollections(): Promise<CollectionAdminDTO[]> {
    const rows = await db.select({ collection: collections, productCount: count(collectionProducts.productId) }).from(collections).leftJoin(collectionProducts, eq(collectionProducts.collectionId, collections.id)).groupBy(collections.id).orderBy(asc(collections.sortOrder), asc(collections.id));
    const links = await db.select().from(collectionProducts).orderBy(asc(collectionProducts.sortOrder));
    return rows.map(({ collection: row, productCount }) => ({ id: row.id, title: row.title, slug: row.slug, description: row.description ?? "", bannerUrl: row.bannerUrl ?? "", bannerPath: row.bannerPath ?? "", isActive: row.isActive, showOnHome: row.showOnHome, showInMenu: row.showInMenu, sortOrder: row.sortOrder, productCount, productIds: links.filter((link) => link.collectionId === row.id).map((link) => link.productId) }));
  }
  async function productChoices(query = "", ids: string[] = [], requestedPage = 1) {
    const normalized = normalizeVietnamese(query).slice(0, 100).replace(/[\\%_]/g, "\\$&");
    const where = ids.length ? inArray(products.id, ids) : normalized ? or(ilike(products.searchText, `%${normalized}%`), ilike(products.code, `%${normalized}%`)) : undefined;
    const [total] = await db.select({ total: count() }).from(products).where(where);
    const page = Math.max(1, Math.floor(requestedPage) || 1), totalPages = Math.max(1, Math.ceil(total.total / 20));
    const rows = await db.select({ id: products.id, name: products.name, code: products.code, status: products.status,
      imageUrl: sql<string | null>`(select pi.url from product_images pi where pi.product_id = ${products.id} order by pi.sort_order, pi.id limit 1)` }).from(products).where(where).orderBy(desc(products.updatedAt), asc(products.id)).limit(ids.length ? 500 : 20).offset(ids.length ? 0 : (Math.min(page, totalPages) - 1) * 20);
    return { products: rows satisfies ProductChoiceDTO[], total: total.total, page: Math.min(page, totalPages), totalPages };
  }
  async function saveCollection(input: CollectionInput) {
    const result = await db.transaction(async (tx) => {
      await lockCatalog(tx);
      const [old] = input.id ? await tx.select().from(collections).where(eq(collections.id, input.id)) : [];
      if (input.id && !old) throw new AppError("NOT_FOUND");
      const slug = await catalogSlug(tx, input.title, input.slug, "collection", input.id);
      if (Boolean(input.bannerUrl) !== Boolean(input.bannerPath)) throw new AppError("VALIDATION_ERROR", "Thông tin ảnh chưa đầy đủ.");
      if (input.bannerUrl && !(old?.bannerUrl === input.bannerUrl && old.bannerPath === input.bannerPath)) assertStoredMedia({ url: input.bannerUrl, path: input.bannerPath }, "banners");
      if (input.productIds.length && (await tx.select({ id: products.id }).from(products).where(inArray(products.id, input.productIds))).length !== input.productIds.length) throw new AppError("VALIDATION_ERROR", "Có sản phẩm không còn tồn tại. Vui lòng chọn lại.");
      const values = { title: input.title, slug, description: input.description || null, bannerUrl: input.bannerUrl || null, bannerPath: input.bannerPath || null, isActive: input.isActive, showOnHome: input.showOnHome, showInMenu: input.showInMenu, sortOrder: input.sortOrder, updatedAt: new Date() };
      const [saved] = old ? await tx.update(collections).set(values).where(eq(collections.id, old.id)).returning({ id: collections.id }) : await tx.insert(collections).values(values).returning({ id: collections.id });
      await tx.delete(collectionProducts).where(eq(collectionProducts.collectionId, saved.id));
      if (input.productIds.length) await tx.insert(collectionProducts).values(input.productIds.map((productId, sortOrder) => ({ productId, collectionId: saved.id, sortOrder })));
      return { id: saved.id, removed: old?.bannerPath && old.bannerPath !== input.bannerPath ? [old.bannerPath] : [] };
    });
    await removeMedia(result.removed); return { id: result.id };
  }
  async function deleteCollection(id: string) {
    const old = await db.transaction(async (tx) => { await lockCatalog(tx); const [row] = await tx.delete(collections).where(eq(collections.id, id)).returning({ path: collections.bannerPath }); if (!row) throw new AppError("NOT_FOUND"); return row; });
    if (old.path) await removeMedia([old.path]); return { id };
  }
  async function listBanners(): Promise<BannerAdminDTO[]> {
    return (await db.select().from(banners).orderBy(asc(banners.sortOrder), asc(banners.id))).map((row) => ({ id: row.id, title: row.title, desktopImageUrl: row.desktopImageUrl, desktopImagePath: row.desktopImagePath, mobileImageUrl: row.mobileImageUrl, mobileImagePath: row.mobileImagePath, alt: row.alt, href: row.href, ctaLabel: row.ctaLabel, sortOrder: row.sortOrder, isActive: row.isActive, startsAt: row.startsAt?.toISOString() ?? null, endsAt: row.endsAt?.toISOString() ?? null }));
  }
  async function saveBanner(input: BannerInput) {
    const result = await db.transaction(async (tx) => {
      await lockCatalog(tx);
      const [old] = input.id ? await tx.select().from(banners).where(eq(banners.id, input.id)) : [];
      if (input.id && !old) throw new AppError("NOT_FOUND");
      for (const [url, path] of [[input.desktopImageUrl, input.desktopImagePath], [input.mobileImageUrl, input.mobileImagePath]]) {
        if (!old || ![[old.desktopImageUrl, old.desktopImagePath], [old.mobileImageUrl, old.mobileImagePath]].some(([existingUrl, existingPath]) => url === existingUrl && path === existingPath)) assertStoredMedia({ url, path }, "banners");
      }
      const { id, ...values } = input;
      const data = { ...values, startsAt: input.startsAt ? new Date(input.startsAt) : null, endsAt: input.endsAt ? new Date(input.endsAt) : null, updatedAt: new Date() };
      const [saved] = old ? await tx.update(banners).set(data).where(eq(banners.id, old.id)).returning({ id: banners.id }) : await tx.insert(banners).values(data).returning({ id: banners.id });
      void id;
      return { id: saved.id, removed: old ? [old.desktopImagePath, old.mobileImagePath].filter((path) => ![input.desktopImagePath, input.mobileImagePath].includes(path)) : [] };
    });
    await removeMedia(result.removed); return { id: result.id };
  }
  async function deleteBanner(id: string) {
    const old = await db.transaction(async (tx) => { await lockCatalog(tx); const [row] = await tx.delete(banners).where(eq(banners.id, id)).returning({ desktop: banners.desktopImagePath, mobile: banners.mobileImagePath }); if (!row) throw new AppError("NOT_FOUND"); return row; });
    await removeMedia([old.desktop, old.mobile]); return { id };
  }
  async function reorder(kind: "collections" | "banners", id: string, direction: "up" | "down") {
    return db.transaction(async (tx) => {
      await lockCatalog(tx); const table = kind === "collections" ? collections : banners;
      const rows = await tx.select({ id: table.id }).from(table).orderBy(asc(table.sortOrder), asc(table.id));
      const index = rows.findIndex((row) => row.id === id), next = index + (direction === "up" ? -1 : 1);
      if (index < 0) throw new AppError("NOT_FOUND");
      if (next >= 0 && next < rows.length) [rows[index], rows[next]] = [rows[next], rows[index]];
      for (let i = 0; i < rows.length; i++) await tx.update(table).set({ sortOrder: i, updatedAt: new Date() }).where(eq(table.id, rows[i].id));
      return { id };
    });
  }
  return { listCollections, saveCollection, deleteCollection, productChoices, listBanners, saveBanner, deleteBanner, reorder };
}
export const getContentService = () => createContentService(getDatabase());
