import "server-only";

import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { orderFiltersSchema } from "@/lib/order-admin";
import { createDatabase } from "@/server/db/client";
import { categories, orderEvents, orderItems, orders, productColors, products, productVariants, settings, user } from "@/server/db/schema";
import { defaultSettings } from "@/lib/validation/settings";
import { createOrderAdminService } from "./order-admin.service";
import { createOrderService } from "./order.service";

const testUrl = process.env.TEST_DATABASE_URL;
describe.skipIf(!testUrl)("admin orders on isolated PostgreSQL", () => {
  let database: ReturnType<typeof createDatabase>;
  let admin: ReturnType<typeof createOrderAdminService>;
  let service: ReturnType<typeof createOrderService>;
  const actor = "phase10-test-actor";
  beforeAll(async () => {
    if (!testUrl || !new URL(testUrl).pathname.endsWith("_test")) throw new Error("Chỉ dùng database _test");
    for (const other of [process.env.DATABASE_URL, process.env.DIRECT_URL].filter((value): value is string => Boolean(value))) if (new URL(other).host === new URL(testUrl).host && new URL(other).pathname === new URL(testUrl).pathname) throw new Error("Không dùng dev/prod");
    database = createDatabase(testUrl);
    await migrate(database.db, { migrationsFolder: "src/server/db/migrations" });
    admin = createOrderAdminService(database.db); service = createOrderService(database.db, "test-admin-order-secret-at-least-32-characters");
    await database.db.insert(user).values({ id: actor, name: "Nhân viên lịch sử", email: "phase10-actor@example.test", role: "staff" }).onConflictDoNothing();
  }, 60000);
  afterAll(async () => { if (database) { await database.db.delete(user).where(eq(user.id, actor)); await database.connection.end(); } });
  beforeEach(async () => { await database.db.execute(sql`TRUNCATE orders, products, categories, settings CASCADE`); });
  async function order(values: Partial<typeof orders.$inferInsert> = {}, quantity = 2) {
    const id = randomUUID();
    await database.db.insert(orders).values({ id, code: `CS${id.replaceAll("-", "").slice(0, 16).toUpperCase()}`, idempotencyKey: id, accessTokenHash: "0".repeat(64), customerName: "Khách kiểm thử", customerPhone: "0912345678", province: "Tỉnh kiểm thử", ward: "Phường kiểm thử", addressLine: "Địa chỉ kiểm thử", paymentMethod: "cod", subtotal: 200000, shippingFee: 30000, total: 230000, ...values });
    await database.db.insert(orderItems).values({ orderId: id, productName: "Áo kiểm thử", productSlug: "ao-kiem-thu", colorName: "Đen", size: "M", sku: "TEST-M", unitPrice: 100000, quantity, lineTotal: quantity * 100000 });
    return id;
  }
  it("filters literal searches, status counts, payment/date and paginates 20 orders", async () => {
    for (let index = 0; index < 22; index++) await order({ code: `PAGE${index}`, customerName: index === 0 ? "Khách % đặc biệt" : "Khách", status: index < 2 ? "confirmed" : "pending", createdAt: new Date("2026-10-28T17:00:00Z") });
    const all = await admin.list(orderFiltersSchema.parse({})); expect(all.total).toBe(22); expect(all.items).toHaveLength(20); expect(all.items[0].itemCount).toBe(2); expect(all.counts).toMatchObject({ all: 22, confirmed: 2, pending: 20 });
    expect((await admin.list(orderFiltersSchema.parse({ page: 100 }))).items).toHaveLength(2);
    expect((await admin.list(orderFiltersSchema.parse({ q: "%" }))).total).toBe(1);
    expect((await admin.list(orderFiltersSchema.parse({ from: "2026-10-29" }))).total, "from midnight").toBe(22);
    expect((await admin.list(orderFiltersSchema.parse({ to: "2026-10-29" }))).total, "to midnight").toBe(22);
    expect((await admin.list(orderFiltersSchema.parse({ paymentStatus: "unpaid", paymentMethod: "cod" }))).total, "payment filters").toBe(22);
    expect((await admin.list(orderFiltersSchema.parse({ status: "confirmed", from: "2026-10-29", to: "2026-10-29", paymentStatus: "unpaid", paymentMethod: "cod" }))).total).toBe(2);
    expect((await admin.list(orderFiltersSchema.parse({ to: "2026-10-28" }))).total).toBe(0);
  });
  it("calculates revenue from eligible statuses and Vietnam creation days, withholding staff revenue", async () => {
    await order({ status: "confirmed", createdAt: new Date("2026-10-28T17:00:00Z"), total: 100000 });
    await order({ status: "shipping", createdAt: new Date("2026-10-28T16:59:59Z"), total: 200000 });
    await order({ status: "completed", createdAt: new Date("2026-10-01T17:00:00Z"), total: 300000 });
    for (const status of ["pending", "cancelled", "returned"] as const) await order({ status, total: 900000 });
    const dashboard = await admin.dashboard("admin", new Date("2026-10-29T03:00:00Z"));
    expect(dashboard.revenue).toMatchObject({ today: 100000, week: 300000, month: 600000 }); expect(dashboard.revenue?.days).toHaveLength(14); expect(dashboard.revenue?.days.at(-1)?.total).toBe(100000);
    expect((await admin.dashboard("staff")).revenue).toBeNull();
  });
  it("shows low stock only for active products and active variants using the shop threshold", async () => {
    const categoryId = randomUUID(), productId = randomUUID(), colorId = randomUUID();
    await database.db.insert(categories).values({ id: categoryId, name: "Áo", slug: "ao-low-stock" });
    await database.db.insert(products).values({ id: productId, categoryId, name: "Áo tồn thấp", code: "LOW10", slug: "low10", status: "active", price: 100000, searchText: "ao ton thap" });
    await database.db.insert(productColors).values({ id: colorId, productId, name: "Đen", code: "DEN", hex: "#000000" });
    await database.db.insert(productVariants).values([{ productId, colorId, size: "S", sku: "LOW-S", stock: 2 }, { productId, colorId, size: "M", sku: "LOW-M", stock: 3 }, { productId, colorId, size: "L", sku: "LOW-L", stock: 1, isActive: false }]);
    await database.db.insert(settings).values({ key: "orders", value: { ...defaultSettings.orders, lowStockThreshold: 2 } });
    expect((await admin.dashboard("staff")).lowStock).toEqual([expect.objectContaining({ productId, color: "Đen", size: "S", stock: 2 })]);
    await database.db.update(products).set({ status: "archived" }).where(eq(products.id, productId));
    expect((await admin.dashboard("staff")).lowStockTotal).toBe(0);
  });
  it("ships atomically with tracking and keeps all actor/message history private to admin", async () => {
    const id = await order({ status: "confirmed" });
    await service.updateStatus({ orderId: id, toStatus: "shipping", reason: "", carrier: "GHN", trackingCode: "TRACK-10" }, actor);
    await service.addNote(id, "Ghi chú riêng", actor);
    await service.updateShipping(id, "GHTK", "TRACK-NEW", actor);
    const detail = await service.getAdminDetail(id);
    expect(detail).toMatchObject({ status: "shipping", carrier: "GHTK", trackingCode: "TRACK-NEW" });
    expect(detail.events).toEqual(expect.arrayContaining([expect.objectContaining({ type: "shipping_updated", message: "GHN · TRACK-10", actorName: "Nhân viên lịch sử" }), expect.objectContaining({ type: "note", message: "Ghi chú riêng" })]));
    const lookup = await service.lookup({ code: detail.code, phone: detail.customerPhone, website: "" }, "198.51.100.10");
    expect(JSON.stringify(lookup)).not.toContain("Ghi chú riêng"); expect(JSON.stringify(lookup)).not.toContain("Nhân viên lịch sử");
    await expect(service.updateStatus({ orderId: id, toStatus: "shipping", reason: "", carrier: "NO", trackingCode: "NO" }, actor)).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
    expect((await service.getAdminDetail(id)).trackingCode).toBe("TRACK-NEW");
  });
  it("exports filtered product rows with BOM and formula protection, preserving snapshots", async () => {
    const id = await order({ customerName: "=FORMULA", paymentMethod: "bank_transfer" });
    await database.db.insert(orderItems).values({ orderId: id, productName: 'Áo, "trắng"', productSlug: "ao", colorName: "Trắng", size: "L", sku: "SKU-L", unitPrice: 1, quantity: 1, lineTotal: 1 });
    await order();
    let csv = ""; for await (const chunk of admin.exportCsv(orderFiltersSchema.parse({ paymentMethod: "bank_transfer" }))) csv += chunk;
    expect(csv.charCodeAt(0)).toBe(0xfeff); expect(csv.trim().split("\r\n")).toHaveLength(3); expect(csv).toContain("'=FORMULA"); expect(csv).toContain('Áo, ""trắng""'); expect(csv).toContain("230000");
  });
  it("rejects payment refunds outside cancelled/returned and records each payment only once", async () => {
    const id = await order({ paymentMethod: "bank_transfer" });
    await Promise.all([service.markPaid(id, actor), service.markPaid(id, actor)]);
    expect((await database.db.select().from(orderEvents).where(eq(orderEvents.orderId, id))).filter((event) => event.type === "payment_updated")).toHaveLength(1);
    await expect(service.markRefunded(id, actor)).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
    await service.updateStatus({ orderId: id, toStatus: "cancelled", reason: "Khách yêu cầu hủy" }, actor);
    await service.markRefunded(id, actor); expect((await service.getAdminDetail(id)).paymentStatus).toBe("refunded");
  });
});
