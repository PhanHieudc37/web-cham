import "server-only";

import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDatabase } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { categories, collectionProducts, collections, productColors, productImages, products, productVariants, settings } from "@/server/db/schema";
import { defaultSettings } from "@/lib/validation/settings";
import { checkoutSchema } from "@/lib/validation/checkout";
import { listingSortSchema, parseListingFilters } from "@/lib/validation/listing";
import { filterListing } from "@/lib/listing";
import { searchIndex } from "@/lib/search";
import { createCatalogService } from "./catalog.service";
import { getProductAvailability } from "./availability.service";
import { quoteCart } from "./cart.service";
import { createOrderService } from "./order.service";
import { createOrderAdminService } from "./order-admin.service";
import { createProductService } from "./product.service";
import { createContactService } from "./contact.service";
import { orderFiltersSchema } from "@/lib/order-admin";
import { readDatabasePage } from "@/server/db/pagination";

const url = process.env.TEST_DATABASE_URL;
describe.skipIf(!url)("cached storefront equivalence and fresh availability", () => {
  let database: ReturnType<typeof createDatabase>, catalog: ReturnType<typeof createCatalogService>;
  const categoryId = randomUUID(), parentId = randomUUID(), hiddenId = randomUUID(), manualId = randomUUID();
  let ids: string[] = [], variantIds: string[][] = [];
  beforeAll(async () => {
    if (!url || !new URL(url).pathname.endsWith("_test")) throw new Error("Only a dedicated _test database is allowed");
    for (const value of [process.env.DATABASE_URL, process.env.DIRECT_URL].filter((value): value is string => Boolean(value))) {
      if (new URL(value).host === new URL(url).host && new URL(value).pathname === new URL(url).pathname) throw new Error("Never test against shop data");
    }
    database = createDatabase(url); await migrate(database.db, { migrationsFolder: "src/server/db/migrations" });
    catalog = createCatalogService(database.db);
  });
  afterAll(async () => { await database?.connection.end(); });
  beforeEach(async () => {
    await database.db.execute(sql`TRUNCATE orders, products, categories, collections, settings, rate_limits CASCADE`);
    await database.db.insert(settings).values(Object.entries(defaultSettings).map(([key, value]) => ({ key, value })));
    await database.db.insert(categories).values([{ id: parentId, name: "Áo", slug: "ao" }, { id: categoryId, parentId, name: "Áo thun", slug: "ao-thun" }, { id: hiddenId, name: "Ẩn", slug: "an", isActive: false }]);
    const prices = [100000, 199999, 200000, 300000, 400000, 400001, 200000, 400000, 90000, 110000, 130000, 150000, 160000, 100000, 450000];
    ids = prices.map(() => randomUUID()); variantIds = prices.map(() => [randomUUID(), randomUUID()]);
    await database.db.insert(products).values(prices.map((price, index) => ({ id: ids[index], categoryId: index === 14 ? hiddenId : categoryId,
      code: `PERF${index}`, slug: `ao-${index}`, name: `Áo thun ${index}`, status: index === 13 ? "draft" as const : "active" as const, price,
      compareAtPrice: index % 3 ? price + 100000 : null, sortOrder: index % 4, publishedAt: index % 5 ? new Date(Date.now() - index * 86400000) : null,
      isNew: index % 2 === 0, isBestSeller: index % 4 === 0, soldCount: index % 5, searchText: `ao thun perf${index} den trang` })));
    for (const [index, id] of ids.entries()) {
      const black = randomUUID(), white = randomUUID();
      await database.db.insert(productColors).values([{ id: black, productId: id, name: "Đen", code: "DEN", hex: "#000000" }, { id: white, productId: id, name: "Trắng", code: "trang", hex: "#ffffff" }]);
      await database.db.insert(productVariants).values([
        { id: variantIds[index][0], productId: id, colorId: black, size: index % 2 ? "L" : "M", sku: `PERF${index}-DEN`, stock: [2, 7].includes(index) ? 0 : 3, isActive: index !== 3 },
        { id: variantIds[index][1], productId: id, colorId: white, size: index % 2 ? "M" : "L", sku: `PERF${index}-TRANG`, stock: [2, 7].includes(index) ? 0 : 3 },
      ]);
      await database.db.insert(productImages).values({ productId: id, url: "/images/placeholder.svg", storagePath: `test/${id}.svg` });
    }
    await database.db.insert(collections).values({ id: manualId, title: "Bộ sưu tập", slug: "bo-suu-tap" });
    await database.db.insert(collectionProducts).values(ids.slice(0, 10).map((productId, index) => ({ collectionId: manualId, productId, sortOrder: 10 - index })));
  });
  it("matches SQL filtering, exact price boundaries, same-variant matching, sorting and pagination", async () => {
    const combinations = [{}, { size: "M" }, { size: "M,L", color: "trang" }, { size: "M", color: "den" }, { size: "L", color: "DEN,trang" },
      { size: "unknown", color: "unknown" }, { price: "under-200" }, { price: "200-400" }, { price: "over-400" }, { instock: "1" }, { size: "M", color: "trang", instock: "1", price: "200-400" }, { page: "2" }, { page: "999" }];
    for (const slug of ["all", "ao", "ao-thun", "bo-suu-tap", "sale", "best-seller", "new-arrival"]) {
      const data = await catalog.getListingData(slug);
      for (const sort of [undefined, ...listingSortSchema.options]) for (const combination of combinations) {
        const filters = parseListingFilters({ ...combination, sort });
        const actual = filterListing(data.items, filters, data.facets, data.defaultSort), expected = await catalog.getListing(slug, filters);
        expect({ slug, filters, ids: actual.products.map((product) => product.id), total: actual.total, page: actual.page, totalPages: actual.totalPages })
          .toEqual({ slug, filters, ids: expected.products.map((product) => product.id), total: expected.total, page: expected.page, totalPages: expected.totalPages });
        expect(data.facets).toEqual(expected.facets);
      }
    }
  }, 90000);
  it("search index excludes hidden/draft products and matches SQL search ordering on representative queries", async () => {
    const index = await catalog.getSearchIndex(); expect(index).toHaveLength(13);
    for (const query of ["áo thun", "PERF1", "den trang", "khong-co", "a"]) {
      const actual = searchIndex(index, query), expected = await catalog.search(query);
      expect(actual.products.map((product) => product.id)).toEqual(expected.products.map((product) => product.id));
      expect(actual.total).toBe(expected.total);
    }
    expect(index[0]).not.toHaveProperty("options"); expect(index[0]).not.toHaveProperty("variants"); expect(index[0]).not.toHaveProperty("stock");
  });
  it("availability uses one SELECT and immediately reflects price, active stock and settings without cache", async () => {
    const queries: string[] = [];
    const tracked = drizzle(database.connection, { schema, casing: "snake_case", logger: { logQuery(query) { queries.push(query); } } });
    const first = await getProductAvailability(ids[0], tracked); expect(first.variants[0].maxQuantity).toBe(3); expect(queries).toHaveLength(1);
    await database.db.update(productVariants).set({ stock: 1 }).where(eq(productVariants.productId, ids[0]));
    await database.db.update(products).set({ price: 120000 }).where(eq(products.id, ids[0]));
    const fresh = await getProductAvailability(ids[0], tracked); expect(fresh.price).toBe(120000); expect(fresh.variants.every((variant) => variant.maxQuantity === 1 && variant.lowStockCount === 1)).toBe(true);
    await expect(getProductAvailability(ids[13], tracked)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(getProductAvailability(ids[14], tracked)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await database.db.update(categories).set({ isActive: false }).where(eq(categories.id, parentId));
    await expect(getProductAvailability(ids[0], tracked)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  async function orderInput(lines: { variantId: string; quantity: number }[]) {
    const quote = await quoteCart(lines, database.db);
    return checkoutSchema.parse({ lines, expectedTotal: quote.total, idempotencyKey: randomUUID(), customerName: "Khách kiểm thử", customerPhone: "0912345678", province: "Hà Nội", ward: "Phường thử", addressLine: "Địa chỉ kiểm thử", paymentMethod: "cod", acceptedPolicies: true });
  }
  it("reports only full sold-out and first restock transitions, preserving idempotent outcomes", async () => {
    const service = createOrderService(database.db, "performance-test-secret-at-least-32-characters");
    const partial = await service.placeOrderWithOutcome(await orderInput([{ variantId: variantIds[0][0], quantity: 1 }]), "198.51.100.6");
    expect(partial.soldOutProductIds).toEqual([]);
    const input = await orderInput([{ variantId: variantIds[0][0], quantity: 2 }, { variantId: variantIds[0][1], quantity: 3 }]);
    const last = await service.placeOrderWithOutcome(input, "198.51.100.6"); expect(last.soldOutProductIds).toEqual([ids[0]]);
    expect((await service.placeOrderWithOutcome(input, "198.51.100.6")).soldOutProductIds).toEqual([]);
    if (!last.createdOrderId || !partial.createdOrderId) throw new Error("Expected committed orders");
    expect((await service.updateStatus({ orderId: last.createdOrderId, toStatus: "cancelled", reason: "Khách hủy" }, "test-staff")).availableProductIds).toEqual([ids[0]]);
    expect((await service.updateStatus({ orderId: partial.createdOrderId, toStatus: "cancelled", reason: "Khách hủy" }, "test-staff")).availableProductIds).toEqual([]);
  });
  it("serializes full-stock transitions across buyers of different variants", async () => {
    await database.db.update(productVariants).set({ stock: 1 }).where(eq(productVariants.productId, ids[0]));
    const service = createOrderService(database.db, "performance-test-secret-at-least-32-characters");
    const inputs = await Promise.all(variantIds[0].map((variantId) => orderInput([{ variantId, quantity: 1 }])));
    const results = await Promise.all(inputs.map((input, index) => service.placeOrderWithOutcome(input, `198.51.100.${index + 10}`)));
    expect(results.flatMap((result) => result.soldOutProductIds)).toEqual([ids[0]]);
    expect((await getProductAvailability(ids[0], database.db)).isSoldOut).toBe(true);
  });
  it("keeps admin data reads within query budgets with populated and empty results", async () => {
    const orderId = randomUUID();
    await database.db.insert(schema.orders).values({ id: orderId, code: `PERF${orderId.slice(0, 8)}`, idempotencyKey: orderId, accessTokenHash: "0".repeat(64), customerName: "Khách kiểm thử", customerPhone: "0912345678", province: "Tỉnh kiểm thử", ward: "Phường kiểm thử", addressLine: "Địa chỉ kiểm thử", paymentMethod: "cod", subtotal: 100000, shippingFee: 30000, total: 130000 });
    await database.db.insert(schema.orderItems).values({ orderId, productId: ids[0], variantId: variantIds[0][0], productName: "Áo kiểm thử", productSlug: "ao-0", colorName: "Đen", size: "M", sku: "PERF0-DEN", unitPrice: 100000, quantity: 1, lineTotal: 100000 });
    const queries: string[] = [];
    const tracked = drizzle(database.connection, { schema, casing: "snake_case", logger: { logQuery(query) { queries.push(query); } } });
    const admin = createOrderAdminService(tracked), product = createProductService(tracked), order = createOrderService(tracked, "performance-query-budget-secret-at-least-32-characters");
    await admin.dashboard("admin"); expect(queries).toHaveLength(4); queries.length = 0;
    expect((await admin.dashboard("staff")).revenue).toBeNull(); expect(queries).toHaveLength(3); queries.length = 0;
    expect((await admin.list(orderFiltersSchema.parse({ page: "999" }))).items).toHaveLength(1); expect(queries).toHaveLength(2); queries.length = 0;
    expect((await order.getAdminDetail(orderId)).items).toHaveLength(1); expect(queries).toHaveLength(4); queries.length = 0;
    expect((await product.list({ page: 999, lowStock: true })).products.length).toBeGreaterThan(0); expect(queries).toHaveLength(1); queries.length = 0;
    const [detail, options, history] = await Promise.all([product.get(ids[0]), product.options(), product.history(ids[0], 999)]);
    expect(queries).toHaveLength(5); expect(detail.values.variants.map((variant) => variant.colorCode).sort()).toEqual(["den", "trang"]);
    expect(detail.values.variants.every((variant) => variant.stock === 3 && variant.expectedStock === 3)).toBe(true);
    expect(detail.values.images).toHaveLength(1); expect(options.categories).toHaveLength(3); expect(history).toMatchObject({ total: 0, page: 1, totalPages: 1, movements: [] });
    queries.length = 0;
    await createContactService(tracked).list({ status: "new", page: 999 }); expect(queries).toHaveLength(2);
  });
  it("clamps pagination inside one snapshot without losing totals on empty or out-of-range pages", async () => {
    const fields = { id: products.id, code: products.code };
    const input = { id: products.id, fields, from: sql`${products}`, order: sql`${products.code} asc`, pageSize: 3 };
    const last = await readDatabasePage<{ id: string; code: string }>(database.db, { ...input, page: 999 });
    expect(last).toMatchObject({ total: 15, page: 5, totalPages: 5 }); expect(last.items).toHaveLength(3);
    const empty = await readDatabasePage(database.db, { ...input, page: 999, where: sql`false` });
    expect(empty).toEqual({ total: 0, page: 1, totalPages: 1, items: [] });
    expect((await readDatabasePage(database.db, { ...input, page: Infinity })).page).toBe(1);
  });
});
