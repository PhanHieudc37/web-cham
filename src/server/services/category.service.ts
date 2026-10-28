import "server-only";

import { asc, count, eq, inArray, isNull } from "drizzle-orm";
import type { z } from "zod";
import type { categoryInputSchema } from "@/lib/validation/category";
import type { CategoryAdminDTO } from "@/types/catalog-admin";
import { getDatabase, type Database } from "@/server/db/client";
import { categories, products } from "@/server/db/schema";
import { AppError } from "@/server/errors";
import { catalogSlug, lockCatalog, refreshSearchText } from "./catalog-write";
import { assertStoredMedia, removeUnusedMedia } from "./media.service";

export function createCategoryService(db: Database, removeMedia = removeUnusedMedia) {
  async function list(): Promise<CategoryAdminDTO[]> {
    const rows = await db.select({ category: categories, productCount: count(products.id) }).from(categories).leftJoin(products, eq(products.categoryId, categories.id))
      .groupBy(categories.id).orderBy(asc(categories.sortOrder), asc(categories.id));
    return rows.map(({ category, productCount }) => ({ id: category.id, parentId: category.parentId, name: category.name, slug: category.slug,
      imageUrl: category.imageUrl, imagePath: category.imagePath, isActive: category.isActive, sortOrder: category.sortOrder, productCount }));
  }
  async function save(input: z.output<typeof categoryInputSchema>) {
    const result = await db.transaction(async (tx) => {
      await lockCatalog(tx);
      const [existing] = input.id ? await tx.select().from(categories).where(eq(categories.id, input.id)) : [];
      if (input.id && !existing) throw new AppError("NOT_FOUND");
      if (input.parentId) {
        if (input.parentId === input.id) throw new AppError("VALIDATION_ERROR", "Danh mục không được làm cha của chính nó.", undefined, { parentId: "Danh mục cha không hợp lệ" });
        const [parent] = await tx.select().from(categories).where(eq(categories.id, input.parentId));
        const [child] = input.id ? await tx.select({ id: categories.id }).from(categories).where(eq(categories.parentId, input.id)).limit(1) : [];
        if (!parent || parent.parentId || child) throw new AppError("VALIDATION_ERROR", "Danh mục chỉ được có tối đa hai cấp.", undefined, { parentId: "Chỉ chọn danh mục cấp một; danh mục đang có con không được chuyển thành cấp hai" });
      }
      const slug = await catalogSlug(tx, input.name, input.slug, "category", input.id);
      if (Boolean(input.imageUrl) !== Boolean(input.imagePath)) throw new AppError("VALIDATION_ERROR", "Thông tin ảnh chưa đầy đủ.");
      if (input.imageUrl && !(existing?.imageUrl === input.imageUrl && existing.imagePath === input.imagePath)) assertStoredMedia({ url: input.imageUrl, path: input.imagePath }, "categories");
      const values = { name: input.name, slug, parentId: input.parentId, imageUrl: input.imageUrl || null, imagePath: input.imagePath || null, isActive: input.isActive, sortOrder: input.sortOrder, updatedAt: new Date() };
      const [saved] = existing ? await tx.update(categories).set(values).where(eq(categories.id, existing.id)).returning({ id: categories.id }) : await tx.insert(categories).values(values).returning({ id: categories.id });
      const affected = await tx.select({ id: categories.id }).from(categories).where(eq(categories.parentId, saved.id));
      const productIds = await tx.select({ id: products.id }).from(products).where(inArray(products.categoryId, [saved.id, ...affected.map((row) => row.id)]));
      await refreshSearchText(tx, productIds.map((row) => row.id));
      return { id: saved.id, removed: existing?.imagePath && existing.imagePath !== input.imagePath ? [existing.imagePath] : [] };
    });
    await removeMedia(result.removed); return { id: result.id };
  }
  async function remove(id: string) {
    const result = await db.transaction(async (tx) => {
      await lockCatalog(tx);
      const [category] = await tx.select().from(categories).where(eq(categories.id, id));
      if (!category) throw new AppError("NOT_FOUND");
      const [children, linked] = await Promise.all([tx.select({ id: categories.id }).from(categories).where(eq(categories.parentId, id)).limit(1), tx.select({ id: products.id }).from(products).where(eq(products.categoryId, id)).limit(1)]);
      if (children.length || linked.length) throw new AppError("CONFLICT", "Hãy chuyển sản phẩm sang danh mục khác và gỡ danh mục con trước.");
      await tx.delete(categories).where(eq(categories.id, id)); return category.imagePath;
    });
    if (result) await removeMedia([result]); return { id };
  }
  async function reorder(id: string, direction: "up" | "down") {
    return db.transaction(async (tx) => {
      await lockCatalog(tx);
      const [category] = await tx.select().from(categories).where(eq(categories.id, id));
      if (!category) throw new AppError("NOT_FOUND");
      const siblings = await tx.select().from(categories).where(category.parentId ? eq(categories.parentId, category.parentId) : isNull(categories.parentId)).orderBy(asc(categories.sortOrder), asc(categories.id));
      const index = siblings.findIndex((row) => row.id === id), next = index + (direction === "up" ? -1 : 1);
      if (next >= 0 && next < siblings.length) [siblings[index], siblings[next]] = [siblings[next], siblings[index]];
      for (let order = 0; order < siblings.length; order++) await tx.update(categories).set({ sortOrder: order, updatedAt: new Date() }).where(eq(categories.id, siblings[order].id));
      return { id };
    });
  }
  async function setVisibility(id: string, active: boolean) {
    const [row] = await db.update(categories).set({ isActive: active, updatedAt: new Date() }).where(eq(categories.id, id)).returning({ id: categories.id });
    if (!row) throw new AppError("NOT_FOUND"); return row;
  }
  return { list, save, remove, reorder, setVisibility };
}
export const getCategoryService = () => createCategoryService(getDatabase());
