import "server-only";

import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { count, eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation/checkout";
import { parseListingFilters } from "@/lib/validation/listing";
import { defaultSettings } from "@/lib/validation/settings";
import { createDatabase } from "@/server/db/client";
import { banners, categories, collectionProducts, collections, orderEvents, orderItems, orders, productColors, productImages, products, productVariants, rateLimits, settings, stockMovements } from "@/server/db/schema";
import { rateLimit } from "@/server/rate-limit";
import { createCatalogService } from "./catalog.service";
import { quoteCart } from "./cart.service";
import { adjustInventory } from "./inventory.service";
import { createOrderService } from "./order.service";

const testUrl = process.env.TEST_DATABASE_URL;
describe.skipIf(!testUrl)("business transactions on PostgreSQL", () => {
  let database: ReturnType<typeof createDatabase>;
  let service: ReturnType<typeof createOrderService>;
  let catalog: ReturnType<typeof createCatalogService>;
  let fixture: { productId: string; colorId: string; variantId: string; categoryId: string; parentId: string };
  const actorId = "test-staff";
  const ip = "198.51.100.1";

  beforeAll(async () => {
    if (!testUrl) throw new Error("Thiếu TEST_DATABASE_URL");
    const target = new URL(testUrl);
    if (!target.pathname.endsWith("_test")) throw new Error("Database kiểm thử phải có tên kết thúc bằng _test");
    for (const other of [process.env.DATABASE_URL, process.env.DIRECT_URL].filter((value): value is string => Boolean(value))) {
      const parsed = new URL(other);
      if (parsed.host === target.host && parsed.pathname === target.pathname) throw new Error("Không chạy test trên database dev/prod");
    }
    database = createDatabase(testUrl);
    await migrate(database.db, { migrationsFolder: "src/server/db/migrations" });
    service = createOrderService(database.db, "test-business-token-secret-at-least-32-characters");
    catalog = createCatalogService(database.db);
  }, 60000);
  afterAll(async () => { if (database) await database.connection.end(); });
  beforeEach(async () => {
    await database.db.execute(sql`TRUNCATE orders, products, categories, collections, banners, settings, rate_limits CASCADE`);
    fixture = { productId: randomUUID(), colorId: randomUUID(), variantId: randomUUID(), categoryId: randomUUID(), parentId: randomUUID() };
    await database.db.insert(categories).values([{ id: fixture.parentId, name: "Áo", slug: "ao" }, { id: fixture.categoryId, parentId: fixture.parentId, name: "Áo thun", slug: "ao-thun" }]);
    await database.db.insert(products).values({ id: fixture.productId, code: "CS01", slug: "ao-thun-do", name: "Áo thun đỏ", categoryId: fixture.categoryId, status: "active", price: 100000,
      compareAtPrice: 200000, searchText: "ao thun do cs01 ao den", publishedAt: new Date(), isBestSeller: true, isNew: true });
    await database.db.insert(productColors).values({ id: fixture.colorId, productId: fixture.productId, name: "Đen", code: "DEN", hex: "#000000" });
    await database.db.insert(productVariants).values({ id: fixture.variantId, productId: fixture.productId, colorId: fixture.colorId, size: "M", sku: "CS01-DEN-M", stock: 5 });
    await database.db.insert(productImages).values({ productId: fixture.productId, colorId: fixture.colorId, url: "/images/test.svg", storagePath: "test.svg", alt: "Ảnh áo" });
  });
  const stock = async () => (await database.db.select().from(productVariants).where(eq(productVariants.id, fixture.variantId)))[0].stock;
  const sold = async () => (await database.db.select().from(products).where(eq(products.id, fixture.productId)))[0].soldCount;
  const orderFor = async (code: string) => (await database.db.select().from(orders).where(eq(orders.code, code)))[0];
  async function input(quantity = 1): Promise<CheckoutInput> {
    const lines = [{ variantId: fixture.variantId, quantity }];
    const quote = await quoteCart(lines, database.db);
    return checkoutSchema.parse({ lines, customerName: "Khách kiểm thử", customerPhone: "0912345678", customerEmail: "test@example.test", province: "TP. Hồ Chí Minh", ward: "Phường kiểm thử",
      addressLine: "Địa chỉ kiểm thử", paymentMethod: "cod", acceptedPolicies: true, expectedTotal: quote.total, idempotencyKey: randomUUID() });
  }
  async function place(quantity = 1) {
    const result = await service.placeOrder(await input(quantity), ip);
    return { ...result, order: await orderFor(result.orderCode) };
  }

  it("uses server pricing, decrements stock, snapshots items, and writes the ledger atomically", async () => {
    const result = await place(2);
    expect(result.order).toMatchObject({ subtotal: 200000, shippingFee: 30000, total: 230000, status: "pending", paymentStatus: "unpaid" });
    expect(await stock()).toBe(3); expect(await sold()).toBe(2);
    expect((await database.db.select().from(orderItems))[0]).toMatchObject({ quantity: 2, unitPrice: 100000, lineTotal: 200000, productName: "Áo thun đỏ", sku: "CS01-DEN-M" });
    expect((await database.db.select().from(stockMovements))[0]).toMatchObject({ delta: -2, stockAfter: 3, reason: "order" });
    expect((await database.db.select().from(orderEvents))[0]).toMatchObject({ type: "created", toStatus: "pending" });
    expect(result.order.accessTokenHash).not.toBe(result.accessToken);
    expect(result.accessToken).toHaveLength(43);
  });
  it("allows exactly one concurrent buyer of the last item", async () => {
    await database.db.update(productVariants).set({ stock: 1 });
    const first = await input(), second = await input();
    const outcomes = await Promise.allSettled([service.placeOrder(first, ip), service.placeOrder(second, ip)]);
    expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.find((outcome) => outcome.status === "rejected")).toMatchObject({ reason: { code: "OUT_OF_STOCK" } });
    expect(await stock()).toBe(0); expect(await sold()).toBe(1);
    expect((await database.db.select({ total: count() }).from(orders))[0].total).toBe(1);
  });
  it("serializes concurrent retries of the same idempotency key and recovers the same token", async () => {
    const values = await input(2);
    const [first, retry] = await Promise.all([service.placeOrder(values, ip), service.placeOrder(values, ip)]);
    expect(retry).toEqual(first);
    expect(await service.placeOrder({ ...values, expectedTotal: 0 }, ip)).toEqual(first);
    expect(await stock()).toBe(3);
    expect((await database.db.select({ total: count() }).from(orders))[0].total).toBe(1);
    expect((await database.db.select({ total: count() }).from(stockMovements))[0].total).toBe(1);
  });
  it("returns PRICE_CHANGED with a fresh quote and does not write an order", async () => {
    const values = await input();
    await database.db.update(products).set({ price: 150000 });
    await expect(service.placeOrder(values, ip)).rejects.toMatchObject({ code: "PRICE_CHANGED", details: { subtotal: 150000, total: 180000 } });
    expect(await stock()).toBe(5);
    expect((await database.db.select({ total: count() }).from(orders))[0].total).toBe(0);
  });
  it("identifies exactly one new placement across concurrent retries for post-commit notifications", async () => {
    const values = await input();
    const results = await Promise.all([service.placeOrderWithOutcome(values, ip), service.placeOrderWithOutcome(values, ip)]);
    expect(results.filter((result) => result.createdOrderId !== null)).toHaveLength(1);
    expect(results[0].placement).toEqual(results[1].placement);
    expect(await stock()).toBe(4);
  });
  it("restores inventory and sold count exactly once on concurrent cancellation", async () => {
    const { order } = await place(2);
    const values = { orderId: order.id, toStatus: "cancelled" as const, reason: "Khách đổi ý" };
    const results = await Promise.allSettled([service.updateStatus(values, actorId), service.updateStatus(values, actorId)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.find((result) => result.status === "rejected")).toMatchObject({ reason: { code: "INVALID_TRANSITION" } });
    expect(await stock()).toBe(5); expect(await sold()).toBe(0);
    expect((await database.db.select().from(stockMovements).where(eq(stockMovements.reason, "cancel")))).toHaveLength(1);
    expect((await orderFor(order.code)).cancelReason).toBe("Khách đổi ý");
  });
  it("requires a cancellation reason and rejects skipped or terminal transitions", async () => {
    const { order } = await place();
    await expect(service.updateStatus({ orderId: order.id, toStatus: "shipping", reason: "" }, actorId)).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
    await expect(service.updateStatus({ orderId: order.id, toStatus: "cancelled", reason: "" }, actorId)).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(await stock()).toBe(4);
  });
  it("completes COD as paid and restores a returned order without automatic refund", async () => {
    const { order } = await place(2);
    for (const toStatus of ["confirmed", "shipping", "completed"] as const) await service.updateStatus({ orderId: order.id, toStatus, reason: "" }, actorId);
    const completed = await orderFor(order.code);
    expect(completed.paymentStatus).toBe("paid"); expect(completed.paidAt).toBeInstanceOf(Date); expect(completed.completedAt).toBeInstanceOf(Date);
    await service.updateStatus({ orderId: order.id, toStatus: "returned", reason: "Khách hoàn hàng" }, actorId);
    expect(await stock()).toBe(5); expect(await sold()).toBe(0);
    expect((await orderFor(order.code)).paymentStatus).toBe("paid");
    await service.markRefunded(order.id, actorId);
    expect((await orderFor(order.code)).paymentStatus).toBe("refunded");
    await expect(service.updateStatus({ orderId: order.id, toStatus: "confirmed", reason: "" }, actorId)).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });
  it("marks payment without changing fulfillment status or duplicating payment events", async () => {
    const { order } = await place();
    await service.markPaid(order.id, actorId); await service.markPaid(order.id, actorId);
    expect(await orderFor(order.code)).toMatchObject({ status: "pending", paymentStatus: "paid" });
    expect(await database.db.select().from(orderEvents).where(eq(orderEvents.type, "payment_updated"))).toHaveLength(1);
    await expect(service.markRefunded(order.id, actorId)).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });
  it("keeps stock changes from checkout while applying an admin delta", async () => {
    const values = await input();
    await Promise.all([service.placeOrder(values, ip), adjustInventory({ variantId: fixture.variantId, expectedStock: 5, newStock: 8, note: "Nhập thêm 3" }, actorId, database.db)]);
    expect(await stock()).toBe(7);
    const movements = await database.db.select().from(stockMovements);
    expect(movements.map((movement) => movement.delta).sort((a, b) => a - b)).toEqual([-1, 3]);
  });
  it("rejects a stock delta that would make inventory negative", async () => {
    await database.db.update(productVariants).set({ stock: 1 });
    await expect(adjustInventory({ variantId: fixture.variantId, expectedStock: 5, newStock: 0, note: "" }, actorId, database.db)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(await stock()).toBe(1);
    expect(await database.db.select().from(stockMovements)).toHaveLength(0);
  });
  it("quotes reduced, deleted and hidden variants without counting unavailable lines", async () => {
    const reduced = await quoteCart([{ variantId: fixture.variantId, quantity: 10 }, { variantId: randomUUID(), quantity: 1 }], database.db);
    expect(reduced.lines[0]).toMatchObject({ quantity: 5, maxQuantity: 5, issue: "QUANTITY_REDUCED" });
    expect(reduced.lines[1]).toMatchObject({ quantity: 0, issue: "UNAVAILABLE" });
    expect(reduced.subtotal).toBe(500000);
    await database.db.update(categories).set({ isActive: false }).where(eq(categories.id, fixture.parentId));
    const hidden = await quoteCart([{ variantId: fixture.variantId, quantity: 1 }], database.db);
    expect(hidden.lines[0].issue).toBe("UNAVAILABLE"); expect(hidden.total).toBe(0);
    await expect(service.placeOrder(await input(), ip)).rejects.toMatchObject({ code: "OUT_OF_STOCK" });
  });
  it("does not accept bank transfer until server-side bank details are configured", async () => {
    const values = { ...await input(), paymentMethod: "bank_transfer" as const };
    await expect(service.placeOrder(values, ip)).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    await database.db.insert(settings).values({ key: "bank", value: { bankBin: "970436", bankName: "Ngân hàng kiểm thử", accountNo: "123456", accountName: "TAI KHOAN KIEM THU" } });
    const result = await service.placeOrder(values, ip);
    expect((await service.getSuccess(result.orderCode, result.accessToken)).bank?.accountNo).toBe("123456");
  });
  it("requires code plus phone for lookup and a valid token for private success data", async () => {
    const result = await place();
    await service.addNote(result.order.id, "Ghi chú nội bộ", actorId);
    await service.updateShipping(result.order.id, "Hãng kiểm thử", "TEST123", actorId);
    const found = await service.lookup({ code: result.orderCode.toLowerCase(), phone: "+84912345678", website: "" }, ip);
    expect(found.customerPhone).toBe("0912***678"); expect(found).not.toHaveProperty("addressLine");
    expect(found.events.some((event) => event.type === "note")).toBe(false);
    expect(found).toMatchObject({ carrier: "Hãng kiểm thử", trackingCode: "TEST123" });
    await expect(service.lookup({ code: result.orderCode, phone: "0987654321", website: "" }, ip)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(service.getSuccess(result.orderCode, "wrong-token")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await service.getSuccess(result.orderCode, result.accessToken)).toMatchObject({ addressLine: "Địa chỉ kiểm thử", customerPhone: "0912345678" });
    expect((await service.getAdminDetail(result.order.id)).adminNote).toBe("Ghi chú nội bộ");
  });
  it("keeps order snapshots after product edits and deletion", async () => {
    const result = await place();
    await database.db.delete(products).where(eq(products.id, fixture.productId));
    const success = await service.getSuccess(result.orderCode, result.accessToken);
    expect(success.items[0]).toMatchObject({ productId: null, productName: "Áo thun đỏ", unitPrice: 100000, sku: "CS01-DEN-M" });
    await service.updateStatus({ orderId: result.order.id, toStatus: "cancelled", reason: "Hủy đơn kiểm thử" }, actorId);
  });
  it("atomically rate limits concurrent requests and restarts expired windows", async () => {
    const results = await Promise.allSettled(Array.from({ length: 8 }, () => rateLimit("test:rate", 3, 600, database.db)));
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(3);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(5);
    await database.db.update(rateLimits).set({ resetAt: new Date(0) }).where(eq(rateLimits.key, "test:rate"));
    await rateLimit("test:rate", 3, 600, database.db);
    expect((await database.db.select().from(rateLimits).where(eq(rateLimits.key, "test:rate")))[0].count).toBe(1);
  });
  it("blocks bot submissions without creating orders", async () => {
    await service.placeOrder({ ...await input(), website: "spam" }, ip);
    expect(await database.db.select().from(orders)).toHaveLength(0); expect(await stock()).toBe(5);
  });

  it("filters visibility, normalizes Vietnamese search, and never exposes raw stock", async () => {
    expect((await catalog.search("ÁO ĐỎ")).total).toBe(1);
    expect((await catalog.search("á")).total).toBe(0);
    expect((await catalog.search("áo xanh")).total).toBe(0);
    expect((await catalog.search("%_")).total).toBe(0);
    const detail = await catalog.getProductDetail("ao-thun-do");
    expect(detail.variants[0]).toMatchObject({ available: true, maxQuantity: 5, lowStockCount: null });
    expect(detail.variants[0]).not.toHaveProperty("stock"); expect(detail.discountPercent).toBe(50);
    expect((await catalog.getMenu()).categories[0].children).toEqual([{ name: "Áo thun", slug: "ao-thun" }]);
    await database.db.update(categories).set({ isActive: false }).where(eq(categories.id, fixture.parentId));
    expect((await catalog.getListing("all")).total).toBe(0);
    expect((await catalog.getMenu()).categories).toEqual([]);
    await expect(catalog.getProductDetail("ao-thun-do")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  it("exposes only bounded availability for product size selection and rejects hidden statuses", async () => {
    await database.db.insert(productVariants).values([
      { productId: fixture.productId, colorId: fixture.colorId, size: "L", sku: "CS01-DEN-L", stock: 0 },
      { productId: fixture.productId, colorId: fixture.colorId, size: "XL", sku: "CS01-DEN-XL", stock: 10, isActive: false },
    ]);
    await database.db.insert(settings).values({ key: "orders", value: { ...defaultSettings.orders, maxQtyPerLine: 2, lowStockThreshold: 10 } });
    const detail = await catalog.getProductDetail("ao-thun-do");
    expect(detail.sizes).toEqual(["M", "L"]);
    expect(detail.variants.find((variant) => variant.size === "M")).toMatchObject({ available: true, maxQuantity: 2, lowStockCount: 5 });
    for (const size of ["L", "XL"]) expect(detail.variants.find((variant) => variant.size === size)).toMatchObject({ available: false, maxQuantity: 0, lowStockCount: null });
    for (const status of ["draft", "archived"] as const) {
      await database.db.update(products).set({ status }).where(eq(products.id, fixture.productId));
      await expect(catalog.getProductDetail("ao-thun-do")).rejects.toMatchObject({ code: "NOT_FOUND" });
    }
  });
  it("keeps sold-out products last for every sort, paginates in SQL, and scopes facets", async () => {
    for (let index = 0; index < 13; index++) {
      const id = randomUUID(), colorId = randomUUID();
      await database.db.insert(products).values({ id, categoryId: fixture.categoryId, code: `CS${index + 2}`, slug: `other-${index}`, name: `Áo ${index}`, price: 250000 + index * 1000,
        status: "active", searchText: `ao ${index}`, sortOrder: index + 1, publishedAt: new Date() });
      await database.db.insert(productColors).values({ id: colorId, productId: id, name: "Trắng", code: "TRANG", hex: "#ffffff" });
      await database.db.insert(productVariants).values({ productId: id, colorId, size: "L", sku: `OTHER-${index}-L`, stock: index === 12 ? 0 : 10 });
    }
    await database.db.update(productVariants).set({ stock: 0 }).where(eq(productVariants.id, fixture.variantId));
    for (const sort of ["featured", "newest", "best", "price-asc", "price-desc", "name-asc", "name-desc"]) {
      const first = await catalog.getListing("all", parseListingFilters({ sort }));
      expect(first.total).toBe(14); expect(first.products).toHaveLength(12); expect(first.products.every((product) => !product.isSoldOut)).toBe(true);
      const last = await catalog.getListing("all", parseListingFilters({ sort, page: "2" }));
      expect(last.products).toHaveLength(2); expect(last.products.every((product) => product.isSoldOut)).toBe(true);
    }
    const filtered = await catalog.getListing("ao", parseListingFilters({ size: "M", color: "den", price: "under-200" }));
    expect(filtered.total).toBe(1); expect(filtered.facets.sizes).toEqual(["M", "L"]);
    expect((await catalog.getListing("all", parseListingFilters({ size: "M", color: "trang" }))).total).toBe(0);
    expect((await catalog.getListing("all", parseListingFilters({ instock: "1" }))).total).toBe(12);
    expect((await catalog.getListing("all", parseListingFilters({ page: "100" }))).page).toBe(2);
    expect((await catalog.getListing("all", parseListingFilters({ size: "INVALID", color: "INVALID" }))).total).toBe(14);
  });
  it("supports automatic/manual collections, their product order, related items and banner schedules", async () => {
    const collectionId = randomUUID();
    await database.db.insert(collections).values({ id: collectionId, slug: "test-collection", title: "Bộ sưu tập kiểm thử", showInMenu: true, showOnHome: true });
    await database.db.insert(collectionProducts).values({ collectionId, productId: fixture.productId });
    await database.db.insert(banners).values([{ title: "Đang chạy", desktopImageUrl: "/images/test.svg", desktopImagePath: "test.svg", mobileImageUrl: "/images/test.svg", mobileImagePath: "test.svg", alt: "Ảnh", href: "/collections/all" },
      { title: "Chưa chạy", desktopImageUrl: "/images/test.svg", desktopImagePath: "test.svg", mobileImageUrl: "/images/test.svg", mobileImagePath: "test.svg", alt: "Ảnh", href: "/collections/all", startsAt: new Date(Date.now() + 86400000) }]);
    for (const slug of ["sale", "new-arrival", "best-seller", "test-collection", "ao", "ao-thun"]) expect((await catalog.getListing(slug)).total).toBe(1);
    await expect(catalog.getListing("missing")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await catalog.getRelatedProducts("ao-thun-do")).toEqual([]);
    const home = await catalog.getHome();
    expect(home.banners.map((banner) => banner.title)).toEqual(["Đang chạy"]);
    expect(home.collections[0].products).toHaveLength(1);
    expect((await catalog.getMenu()).collections).toEqual([{ title: "Bộ sưu tập kiểm thử", slug: "test-collection" }]);
  });
  it("reads fresh shipping settings when placing an order", async () => {
    const values = await input(2);
    await database.db.insert(settings).values({ key: "shipping", value: { ...defaultSettings.shipping, fee: 50000 } });
    await expect(service.placeOrder(values, ip)).rejects.toMatchObject({ code: "PRICE_CHANGED", details: { shippingFee: 50000 } });
  });
  it("builds homepage limits and sale visibility only from visible catalog data", async () => {
    await database.db.update(categories).set({ imageUrl: "/images/category.svg" }).where(eq(categories.id, fixture.parentId));
    for (let index = 1; index <= 10; index++) {
      const categoryId = randomUUID(), productId = randomUUID();
      await database.db.insert(categories).values({ id: categoryId, name: `Nhóm ${index}`, slug: `nhom-${index}`, sortOrder: index, isActive: index !== 10 });
      await database.db.insert(products).values({ id: productId, code: `HOME${index}`, name: `Áo ${index}`, slug: `home-${index}`, categoryId, price: 100000, compareAtPrice: 200000,
        status: index === 9 ? "draft" : "active", isNew: true, isBestSeller: true, searchText: `ao ${index}` });
    }
    const home = await catalog.getHome();
    expect(home.categories).toHaveLength(3);
    expect(home.categories[0]).toMatchObject({ slug: "ao", imageUrl: "/images/category.svg" });
    expect(home.bestSeller).toHaveLength(8); expect(home.newArrival).toHaveLength(8); expect(home.sale).toHaveLength(4);
    expect((await catalog.getMenu()).hasSale).toBe(true);
    for (const card of [...home.bestSeller, ...home.newArrival, ...home.sale]) expect(["home-9", "home-10"]).not.toContain(card.slug);
    await database.db.update(products).set({ compareAtPrice: null });
    expect((await catalog.getMenu()).hasSale).toBe(false); expect((await catalog.getHome()).sale).toEqual([]);
    await database.db.update(categories).set({ isActive: false });
    const empty = await catalog.getHome();
    expect(empty.categories).toEqual([]); expect(empty.bestSeller).toEqual([]); expect(empty.newArrival).toEqual([]);
  });
});
