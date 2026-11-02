import "server-only";

import { randomUUID } from "node:crypto";
import { and, asc, eq, exists, ilike, inArray, lte, ne, notInArray, or, sql } from "drizzle-orm";
import type { z } from "zod";
import { defaultSettings } from "@/lib/validation/settings";
import { createSku } from "@/lib/domain/variants";
import { normalizeVietnamese } from "@/lib/normalize";
import { productInputSchema, type ProductInput, type sizeChartInputSchema } from "@/lib/validation/product";
import type { ProductEditorDTO, ProductListItemDTO, ProductOptionsDTO, StockMovementDTO } from "@/types/catalog-admin";
import { getDatabase, type Database } from "@/server/db/client";
import { readDatabasePage } from "@/server/db/pagination";
import { categories, collectionProducts, collections, orders, productColors, productImages, products, productVariants, settings, sizeCharts, stockMovements, user } from "@/server/db/schema";
import { AppError } from "@/server/errors";
import { createCategoryService } from "./category.service";
import { catalogSlug, lockCatalog, refreshSearchText } from "./catalog-write";
import { assertStoredMedia, removeUnusedMedia } from "./media.service";

export type ProductFilters = { query?: string; categoryId?: string; status?: "draft" | "active" | "archived"; lowStock?: boolean; page?: number };
export function createProductService(db: Database, removeMedia = removeUnusedMedia) {
  async function options(): Promise<ProductOptionsDTO> {
    const [allCategories, allCollections, charts] = await Promise.all([
      createCategoryService(db, removeMedia).list(), db.select({ id: collections.id, title: collections.title }).from(collections).orderBy(asc(collections.sortOrder)),
      db.select({ id: sizeCharts.id, name: sizeCharts.name, columns: sizeCharts.columns, rows: sizeCharts.rows, note: sizeCharts.note }).from(sizeCharts).orderBy(asc(sizeCharts.name)),
    ]);
    return { categories: allCategories, collections: allCollections, sizeCharts: charts };
  }
  async function list(filters: ProductFilters) {
    const query = normalizeVietnamese(filters.query ?? "").slice(0, 100).replace(/[\\%_]/g, "\\$&");
    const condition = and(query ? or(ilike(products.searchText, `%${query}%`), ilike(products.code, `%${query}%`)) : undefined,
      filters.categoryId ? eq(products.categoryId, filters.categoryId) : undefined, filters.status ? eq(products.status, filters.status) : undefined,
      filters.lowStock ? exists(db.select({ id: productVariants.id }).from(productVariants).where(and(eq(productVariants.productId, products.id), eq(productVariants.isActive, true), lte(productVariants.stock,
        sql`coalesce((select (${settings.value}->>'lowStockThreshold')::integer from ${settings} where ${settings.key} = 'orders'), ${defaultSettings.orders.lowStockThreshold})`)))) : undefined);
    const result = await readDatabasePage<ProductListItemDTO>(db, { id: products.id, page: filters.page ?? 1, where: condition,
      from: sql`${products} inner join ${categories} on ${products.categoryId} = ${categories.id}`, order: sql`${products.updatedAt} desc, ${products.id} asc`,
      fields: { id: products.id, name: products.name, code: products.code, slug: products.slug, price: products.price, compareAtPrice: products.compareAtPrice, categoryName: categories.name,
      stock: sql<number>`coalesce((select sum(pv.stock) from product_variants pv where pv.product_id = ${products.id} and pv.is_active), 0)::integer`,
      imageUrl: sql<string | null>`(select pi.url from product_images pi where pi.product_id = ${products.id} order by pi.sort_order, pi.id limit 1)`,
      status: products.status, updatedAt: products.updatedAt } });
    return { products: result.items.map((row) => ({ ...row, updatedAt: new Date(row.updatedAt).toISOString() })), total: result.total, page: result.page, totalPages: result.totalPages };
  }
  async function get(id: string): Promise<ProductEditorDTO> {
    const [row] = await db.select({ product: products,
      colors: sql<ProductInput["colors"]>`coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'code', lower(c.code), 'hex', c.hex) order by c.sort_order, c.id) from product_colors c where c.product_id = ${products}.${sql.identifier("id")}), '[]'::jsonb)`,
      variants: sql<ProductInput["variants"]>`coalesce((select jsonb_agg(jsonb_build_object('id', v.id, 'colorCode', lower(c.code), 'size', v.size, 'sku', v.sku, 'stock', v.stock, 'expectedStock', v.stock, 'isActive', v.is_active) order by v.id) from product_variants v join product_colors c on c.id = v.color_id where v.product_id = ${products}.${sql.identifier("id")}), '[]'::jsonb)`,
      images: sql<ProductInput["images"]>`coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'url', i.url, 'storagePath', i.storage_path, 'alt', i.alt, 'colorCode', lower(c.code)) order by i.sort_order, i.id) from product_images i left join product_colors c on c.id = i.color_id where i.product_id = ${products}.${sql.identifier("id")}), '[]'::jsonb)`,
      collectionIds: sql<string[]>`coalesce((select jsonb_agg(cp.collection_id order by cp.sort_order, cp.collection_id) from collection_products cp where cp.product_id = ${products}.${sql.identifier("id")}), '[]'::jsonb)`,
    }).from(products).where(eq(products.id, id));
    if (!row) throw new AppError("NOT_FOUND");
    const { product } = row;
    return { publishedAt: product.publishedAt?.toISOString() ?? null, values: {
      id, code: product.code, name: product.name, slug: product.slug, categoryId: product.categoryId, status: product.status, price: product.price, compareAtPrice: product.compareAtPrice,
      description: product.description, material: product.material ?? "", fit: product.fit ?? "", care: product.care, sizeChartId: product.sizeChartId,
      isNew: product.isNew, isBestSeller: product.isBestSeller, sortOrder: product.sortOrder, seoTitle: product.seoTitle ?? "", seoDescription: product.seoDescription ?? "", stockNote: "",
      colors: row.colors, variants: row.variants, images: row.images, collectionIds: row.collectionIds,
    } };
  }
  async function save(raw: ProductInput, actorId: string) {
    const input = productInputSchema.parse(raw);
    const result = await db.transaction(async (tx) => {
      await lockCatalog(tx);
      const id = input.id ?? randomUUID();
      const [existing] = input.id ? await tx.select().from(products).where(eq(products.id, id)) : [];
      if (input.id && !existing) throw new AppError("NOT_FOUND");
      const [category] = await tx.select().from(categories).where(eq(categories.id, input.categoryId));
      if (!category) throw new AppError("VALIDATION_ERROR", "Danh mục không còn tồn tại.", undefined, { categoryId: "Vui lòng chọn lại danh mục" });
      if (input.sizeChartId && !(await tx.select({ id: sizeCharts.id }).from(sizeCharts).where(eq(sizeCharts.id, input.sizeChartId))).length) throw new AppError("VALIDATION_ERROR", "Bảng size không tồn tại.");
      if (input.collectionIds.length) {
        const linked = await tx.select({ id: collections.id }).from(collections).where(inArray(collections.id, input.collectionIds));
        if (linked.length !== new Set(input.collectionIds).size) throw new AppError("VALIDATION_ERROR", "Bộ sưu tập không tồn tại.");
      }
      const [codeTaken] = await tx.select({ id: products.id }).from(products).where(and(eq(products.code, input.code), ne(products.id, id)));
      if (codeTaken) throw new AppError("CONFLICT", "Mã sản phẩm đã được sử dụng.", undefined, { code: "Mã sản phẩm đã được sử dụng" });
      const slug = await catalogSlug(tx, input.name, input.slug, "product", id);
      const oldVariants = existing ? await tx.select().from(productVariants).where(eq(productVariants.productId, id)).orderBy(asc(productVariants.id)).for("update") : [];
      const oldColors = existing ? await tx.select().from(productColors).where(eq(productColors.productId, id)) : [];
      const oldImages = existing ? await tx.select().from(productImages).where(eq(productImages.productId, id)) : [];
      for (const image of input.images) if (!oldImages.some((old) => old.url === image.url && old.storagePath === image.storagePath)) assertStoredMedia({ url: image.url, path: image.storagePath }, "products");
      for (const variant of input.variants) {
        if (variant.id && !oldVariants.some((entry) => entry.id === variant.id)) throw new AppError("VALIDATION_ERROR", "Biến thể không thuộc sản phẩm này.");
        const [used] = await tx.select({ id: productVariants.id, productId: productVariants.productId }).from(productVariants).where(eq(productVariants.sku, variant.sku.toUpperCase()));
        const matching = variant.id ? oldVariants.find((entry) => entry.id === variant.id) : oldVariants.find((entry) => entry.size === variant.size && oldColors.find((color) => color.id === entry.colorId)?.code.toLowerCase() === variant.colorCode);
        if (used && used.id !== matching?.id) throw new AppError("CONFLICT", `SKU ${variant.sku} đã được sử dụng.`, undefined, { variants: "SKU đã được sử dụng" });
      }
      const values = { code: input.code, name: input.name, slug, categoryId: input.categoryId, status: input.status, price: input.price, compareAtPrice: input.compareAtPrice,
        description: input.description, material: input.material || null, fit: input.fit || null, care: input.care, sizeChartId: input.sizeChartId, isNew: input.isNew, isBestSeller: input.isBestSeller,
        sortOrder: input.sortOrder, seoTitle: input.seoTitle || null, seoDescription: input.seoDescription || null, updatedAt: new Date(),
        publishedAt: existing?.publishedAt ?? (input.status === "active" ? new Date() : null) };
      if (existing) await tx.update(products).set(values).where(eq(products.id, id));
      else await tx.insert(products).values({ id, ...values, searchText: "" });
      const colorIds = new Map<string, string>();
      // Retained colors still referenced by historical variants are never deleted.
      for (let index = 0; index < input.colors.length; index++) {
        const color = input.colors[index];
        const old = color.id ? oldColors.find((entry) => entry.id === color.id) : oldColors.find((entry) => entry.code.toLowerCase() === color.code);
        if (color.id && !old) throw new AppError("VALIDATION_ERROR", "Màu không thuộc sản phẩm này.");
        const sameCode = oldColors.find((entry) => entry.code.toLowerCase() === color.code && entry.id !== old?.id);
        if (sameCode) throw new AppError("CONFLICT", "Mã màu đã tồn tại trong sản phẩm.", undefined, { colors: "Mã màu bị trùng" });
        const colorId = old?.id ?? randomUUID();
        const data = { name: color.name, code: color.code, hex: color.hex, sortOrder: index };
        if (old) await tx.update(productColors).set(data).where(eq(productColors.id, colorId));
        else await tx.insert(productColors).values({ id: colorId, productId: id, ...data });
        colorIds.set(color.code, colorId);
      }
      const retainedIds: string[] = [];
      for (const variant of input.variants) {
        const colorId = colorIds.get(variant.colorCode);
        if (!colorId) throw new AppError("VALIDATION_ERROR");
        const old = variant.id ? oldVariants.find((entry) => entry.id === variant.id) : oldVariants.find((entry) => entry.colorId === colorId && entry.size === variant.size);
        if (variant.id && !old) throw new AppError("VALIDATION_ERROR", "Biến thể không thuộc sản phẩm này.");
        if (old && (old.colorId !== colorId || old.size !== variant.size)) throw new AppError("CONFLICT", "Không đổi màu/size của biến thể cũ. Hãy thêm biến thể mới.");
        if (old && variant.expectedStock === undefined) throw new AppError("CONFLICT", "Thiếu tồn kho lúc mở form. Vui lòng tải lại.");
        const delta = old ? variant.stock - (variant.expectedStock ?? 0) : variant.stock;
        const stock = (old?.stock ?? 0) + delta;
        if (stock < 0 || stock > 1000000) throw new AppError("CONFLICT", "Tồn kho đã thay đổi, không thể áp dụng điều chỉnh. Vui lòng tải lại.", undefined, { variants: "Tồn kho không hợp lệ sau điều chỉnh" });
        const variantId = old?.id ?? randomUUID();
        const data = { sku: variant.sku.toUpperCase(), stock, isActive: variant.isActive, updatedAt: new Date() };
        if (old) await tx.update(productVariants).set(data).where(eq(productVariants.id, variantId));
        else await tx.insert(productVariants).values({ id: variantId, productId: id, colorId, size: variant.size, ...data });
        if (delta !== 0) await tx.insert(stockMovements).values({ variantId, delta, stockAfter: stock, reason: "manual", actorId, note: input.stockNote || null });
        retainedIds.push(variantId);
      }
      await tx.update(productVariants).set({ isActive: false, updatedAt: new Date() }).where(and(eq(productVariants.productId, id), notInArray(productVariants.id, retainedIds)));
      await tx.delete(productImages).where(eq(productImages.productId, id));
      if (input.images.length) await tx.insert(productImages).values(input.images.map((image, index) => ({ productId: id, url: image.url, storagePath: image.storagePath, alt: image.alt || `${input.name}${image.colorCode ? ` ${input.colors.find((color) => color.code === image.colorCode)?.name ?? ""}` : ""}`, colorId: image.colorCode ? colorIds.get(image.colorCode) : null, sortOrder: index })));
      const previousLinks = await tx.select().from(collectionProducts).where(eq(collectionProducts.productId, id));
      await tx.delete(collectionProducts).where(and(eq(collectionProducts.productId, id), input.collectionIds.length ? notInArray(collectionProducts.collectionId, input.collectionIds) : undefined));
      for (const collectionId of [...new Set(input.collectionIds)]) {
        if (previousLinks.some((link) => link.collectionId === collectionId)) continue;
        const [last] = await tx.select({ position: sql<number>`coalesce(max(${collectionProducts.sortOrder}), -1)` }).from(collectionProducts).where(eq(collectionProducts.collectionId, collectionId));
        await tx.insert(collectionProducts).values({ collectionId, productId: id, sortOrder: Number(last.position) + 1 });
      }
      await refreshSearchText(tx, [id]);
      return { id, removed: oldImages.filter((image) => !input.images.some((next) => next.storagePath === image.storagePath)).map((image) => image.storagePath) };
    });
    await removeMedia(result.removed); return { id: result.id };
  }
  async function setStatus(id: string, status: "draft" | "active" | "archived", actorId: string) {
    const current = await get(id);
    return save({ ...current.values, status }, actorId);
  }
  async function duplicate(id: string, actorId: string) {
    const original = await get(id);
    const copy = original.values;
    let suffix = 1, code = `${copy.code.slice(0, 30)}-COPY`;
    while ((await db.select({ id: products.id }).from(products).where(eq(products.code, code))).length) code = `${copy.code.slice(0, 30)}-COPY${++suffix}`;
    // Existing image objects are shared and removed only when no DB reference remains.
    const images = copy.images.map(({ url, storagePath, alt, colorCode }) => ({ url, storagePath, alt, colorCode }));
    // Seed placeholders are safe only when copying their existing source row.
    return save({ ...copy, id: undefined, slug: undefined, name: `${copy.name.slice(0, 148)} (bản sao)`, code, status: "draft", colors: copy.colors.map(({ name, code, hex }) => ({ name, code, hex })),
      variants: copy.variants.map((variant) => ({ colorCode: variant.colorCode, size: variant.size, sku: createSku(code, variant.colorCode, variant.size), stock: 0, isActive: variant.isActive })), images, stockNote: "" }, actorId);
  }
  async function history(productId: string, requestedPage = 1) {
    const condition = eq(productVariants.productId, productId);
    const result = await readDatabasePage<Omit<StockMovementDTO, "variant"> & { color: string; size: string }>(db, { id: stockMovements.id, page: requestedPage, where: condition,
      from: sql`${stockMovements} inner join ${productVariants} on ${stockMovements.variantId} = ${productVariants.id} inner join ${productColors} on ${productVariants.colorId} = ${productColors.id} left join ${orders} on ${stockMovements.orderId} = ${orders.id} left join ${user} on ${stockMovements.actorId} = ${user.id}`,
      order: sql`${stockMovements.createdAt} desc, ${stockMovements.id} desc`, fields: { id: stockMovements.id, color: productColors.name, size: productVariants.size, delta: stockMovements.delta, stockAfter: stockMovements.stockAfter,
        reason: stockMovements.reason, orderId: stockMovements.orderId, orderCode: orders.code, actorName: user.name, note: stockMovements.note, createdAt: stockMovements.createdAt } });
    return { movements: result.items.map(({ color, size, ...row }): StockMovementDTO => ({ ...row, variant: `${color} / ${size}`, createdAt: new Date(row.createdAt).toISOString() })), total: result.total, totalPages: result.totalPages, page: result.page };
  }
  async function createSizeChart(input: z.output<typeof sizeChartInputSchema>) {
    const [chart] = await db.insert(sizeCharts).values({ ...input, note: input.note || null }).returning({ id: sizeCharts.id }); return chart;
  }
  return { list, options, get, save, duplicate, setStatus, history, createSizeChart };
}
export const getProductService = () => createProductService(getDatabase());
