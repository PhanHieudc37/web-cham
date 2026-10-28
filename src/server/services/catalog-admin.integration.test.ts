import "server-only";
import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, afterAll, describe, expect, it, vi } from "vitest";
import { count, eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { productInputSchema } from "@/lib/validation/product";
import { checkoutSchema } from "@/lib/validation/checkout";
import { createDatabase } from "@/server/db/client";
import { collections, orderItems, products, productVariants, stockMovements } from "@/server/db/schema";
import { createCategoryService } from "./category.service";
import { createProductService } from "./product.service";
import { createOrderService } from "./order.service";
import { quoteCart } from "./cart.service";

const testUrl = process.env.TEST_DATABASE_URL;
describe.skipIf(!testUrl)("admin catalog transactions", () => {
  let database: ReturnType<typeof createDatabase>;
  let categoryService: ReturnType<typeof createCategoryService>, productService: ReturnType<typeof createProductService>;
  let categoryId: string;
  const removeMedia = vi.fn(async (paths: string[]) => { void paths; });
  beforeAll(async () => {
    if (!testUrl) throw new Error("Thiếu TEST_DATABASE_URL");
    const target = new URL(testUrl);
    if (!target.pathname.endsWith("_test")) throw new Error("Database phải có hậu tố _test");
    for (const value of [process.env.DATABASE_URL, process.env.DIRECT_URL].filter((entry): entry is string => Boolean(entry))) {
      const other = new URL(value); if (other.host === target.host && other.pathname === target.pathname) throw new Error("Không chạy test trên dev/prod");
    }
    database = createDatabase(testUrl); await migrate(database.db, { migrationsFolder: "src/server/db/migrations" });
    categoryService = createCategoryService(database.db, removeMedia); productService = createProductService(database.db, removeMedia);
  });
  afterAll(async () => { if (database) await database.connection.end(); });
  beforeEach(async () => {
    removeMedia.mockClear();
    await database.db.execute(sql`TRUNCATE products, categories, collections, settings, orders, rate_limits CASCADE`);
    categoryId = (await categoryService.save({ name: "Áo thun", parentId: null, imageUrl: "", imagePath: "", sortOrder: 0, isActive: true })).id;
  });
  const category = (name: string, parentId: string | null = null, slug?: string) => categoryService.save({ name, slug, parentId, imageUrl: "", imagePath: "", sortOrder: 0, isActive: true });
  const input = (code = "CS01") => productInputSchema.parse({ code, name: "Áo thử nghiệm", categoryId, status: "active", price: 100000, compareAtPrice: null,
    colors: ["den", "trang", "do"].map((code) => ({ name: code, code, hex: "#111111" })),
    variants: ["den", "trang", "do"].flatMap((colorCode) => ["S", "M", "L", "XL"].map((size) => ({ colorCode, size, sku: `${code}-${colorCode}-${size}`, stock: 5, isActive: true }))),
    images: [{ url: "/images/placeholder.svg", storagePath: "/images/placeholder.svg", alt: "Ảnh mẫu", colorCode: "den" }],
  });
  async function orderInput(variantId: string) {
    const lines = [{ variantId, quantity: 1 }], quote = await quoteCart(lines, database.db);
    return checkoutSchema.parse({ lines, customerName: "Khách kiểm thử", customerPhone: "0912345678", province: "Hà Nội", ward: "Phường kiểm thử", addressLine: "Địa chỉ kiểm thử", paymentMethod: "cod", acceptedPolicies: true, expectedTotal: quote.total, idempotencyKey: randomUUID() });
  }
  it("enforces two-level categories, no cycles, no moving a parent with children", async () => {
    const child = await category("Áo con", categoryId);
    await expect(category("Cấp ba", child.id)).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    const target = await category("Danh mục khác");
    await expect(categoryService.save({ id: categoryId, name: "Áo thun", parentId: target.id, imageUrl: "", imagePath: "", sortOrder: 0, isActive: true })).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    await expect(categoryService.save({ id: child.id, name: "Tự cha", parentId: child.id, imageUrl: "", imagePath: "", sortOrder: 0, isActive: true })).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
  it("protects shared category/collection slugs and reserved routes, auto-suffixes names", async () => {
    await database.db.insert(collections).values({ slug: "bo-suu-tap", title: "Bộ sưu tập" });
    for (const slug of ["all", "sale", "new-arrival", "best-seller", "bo-suu-tap", "ao-thun"]) await expect(category("Trùng", null, slug)).rejects.toMatchObject({ code: "CONFLICT", fields: { slug: expect.any(String) } });
    const next = await category("Áo thun"); expect((await categoryService.list()).find((entry) => entry.id === next.id)?.slug).toBe("ao-thun-2");
  });
  it("reorders only siblings, toggles visibility, and blocks nonempty deletion", async () => {
    const second = await category("Danh mục hai");
    await categoryService.reorder(second.id, "up"); expect((await categoryService.list())[0].id).toBe(second.id);
    await categoryService.setVisibility(second.id, false); expect((await categoryService.list())[0].isActive).toBe(false);
    await category("Con", categoryId); await expect(categoryService.remove(categoryId)).rejects.toMatchObject({ code: "CONFLICT" });
    await categoryService.remove(second.id); expect((await categoryService.list()).some((entry) => entry.id === second.id)).toBe(false);
  });
  it("saves three colors by four sizes and snapshots a stock ledger", async () => {
    const result = await productService.save(input(), "staff-test");
    const editor = await productService.get(result.id);
    expect(editor.values.colors).toHaveLength(3); expect(editor.values.variants).toHaveLength(12); expect(editor.publishedAt).not.toBeNull();
    expect(editor.values.variants.every((variant) => variant.stock === 5 && variant.expectedStock === 5)).toBe(true);
    expect((await database.db.select({ total: count() }).from(stockMovements))[0].total).toBe(12);
    expect((await productService.list({})).products[0]).toMatchObject({ stock: 60, categoryName: "Áo thun" });
    await expect(categoryService.remove(categoryId)).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it("returns field conflicts for duplicate code/slug/SKU and rolls back all writes", async () => {
    const first = await productService.save({ ...input(), slug: "unique-slug" }, "staff-test");
    await expect(productService.save({ ...input(), slug: "different-slug" }, "staff-test")).rejects.toMatchObject({ code: "CONFLICT", fields: { code: expect.any(String) } });
    await expect(productService.save({ ...input("CS02"), slug: "unique-slug" }, "staff-test")).rejects.toMatchObject({ code: "CONFLICT", fields: { slug: expect.any(String) } });
    const sameSku = input("CS02"); sameSku.variants[0].sku = "CS01-DEN-S";
    await expect(productService.save(sameSku, "staff-test")).rejects.toMatchObject({ code: "CONFLICT", fields: { variants: expect.any(String) } });
    expect((await database.db.select({ total: count() }).from(products))[0].total).toBe(1);
    const stale = await productService.get(first.id); stale.values.variants[0].expectedStock = 100; stale.values.variants[0].stock = 0; stale.values.name = "Không được lưu";
    await expect(productService.save(stale.values, "staff-test")).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await productService.get(first.id)).values.name).toBe("Áo thử nghiệm");
  });
  it("preserves checkout deltas and uses the refreshed stock baseline on the next save", async () => {
    const result = await productService.save(input(), "staff-test"), stale = (await productService.get(result.id)).values;
    const variant = stale.variants[0]; variant.stock = 8; stale.stockNote = "Nhập thêm 3";
    const orderService = createOrderService(database.db, "test-catalog-order-secret-at-least-32-characters");
    const checkout = await orderInput(variant.id!);
    await Promise.all([productService.save(stale, "staff-test"), orderService.placeOrder(checkout, "test-ip")]);
    const fresh = (await productService.get(result.id)).values;
    expect(fresh.variants.find((entry) => entry.id === variant.id)).toMatchObject({ stock: 7, expectedStock: 7 });
    await productService.save(fresh, "staff-test");
    expect((await productService.get(result.id)).values.variants.find((entry) => entry.id === variant.id)?.stock).toBe(7);
    expect((await productService.history(result.id)).movements.some((entry) => entry.note === "Nhập thêm 3" && entry.delta === 3)).toBe(true);
  });
  it("retains removed variants and their order references as inactive", async () => {
    const result = await productService.save(input(), "staff-test"), values = (await productService.get(result.id)).values;
    const removed = values.variants[0];
    await createOrderService(database.db, "test-catalog-order-secret-at-least-32-characters").placeOrder(await orderInput(removed.id!), "test-ip");
    values.variants = values.variants.filter((entry) => entry.id !== removed.id);
    await productService.save(values, "staff-test");
    expect((await database.db.select().from(productVariants).where(eq(productVariants.id, removed.id!)))[0]).toMatchObject({ isActive: false, stock: 4 });
    expect((await database.db.select().from(orderItems))[0].variantId).toBe(removed.id);
  });
  it("does not accept a foreign variant/color identifier", async () => {
    const first = await productService.save(input(), "staff-test"), second = await productService.save(input("CS02"), "staff-test");
    const a = (await productService.get(first.id)).values, b = (await productService.get(second.id)).values;
    a.variants[0].id = b.variants[0].id;
    await expect(productService.save(a, "staff-test")).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    a.variants[0].id = undefined; a.colors[0].id = b.colors[0].id;
    await expect(productService.save(a, "staff-test")).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
  it("persists image order/color and cleans removed paths after commit", async () => {
    const original = input();
    const root = process.env.SUPABASE_URL ?? "https://example.supabase.co";
    const images = Array.from({ length: 6 }, (_, index) => { const path = `products/2026/10/${randomUUID()}.webp`; return { url: `${root}/storage/v1/object/public/media/${path}`, storagePath: path, alt: `Ảnh ${index}`, colorCode: index % 2 ? "den" : "do" }; });
    original.images = images;
    const created = await productService.save(original, "staff-test"), values = (await productService.get(created.id)).values;
    values.images.reverse(); values.images.pop(); values.images[0].colorCode = "trang";
    await productService.save(values, "staff-test");
    const saved = (await productService.get(created.id)).values;
    expect(saved.images.map((image) => image.storagePath)).toEqual(values.images.map((image) => image.storagePath)); expect(saved.images[0].colorCode).toBe("trang");
    expect(removeMedia).toHaveBeenLastCalledWith([images[0].storagePath]);
  });
  it("duplicates with zero stock, independent variant IDs and shared image references", async () => {
    const created = await productService.save(input(), "staff-test"), copy = await productService.duplicate(created.id, "staff-test");
    const data = (await productService.get(copy.id)).values;
    expect(data).toMatchObject({ name: "Áo thử nghiệm (bản sao)", code: "CS01-COPY", status: "draft" });
    expect(data.variants.every((variant) => variant.stock === 0)).toBe(true); expect(data.images).toHaveLength(1);
    expect(data.images[0].storagePath).toBe("/images/placeholder.svg");
    await productService.setStatus(created.id, "archived", "staff-test"); expect((await productService.get(created.id)).values.status).toBe("archived");
    await productService.setStatus(created.id, "draft", "staff-test"); expect((await productService.get(created.id)).values.status).toBe("draft");
  });
  it("rebuilds search after category/parent renames and supports list filters", async () => {
    const created = await productService.save(input(), "staff-test");
    await categoryService.save({ id: categoryId, name: "Thời trang đẹp", parentId: null, imageUrl: "", imagePath: "", sortOrder: 0, isActive: true });
    expect((await database.db.select().from(products).where(eq(products.id, created.id)))[0].searchText).toContain("thoi trang dep");
    expect((await productService.list({ query: "THỜI TRANG", categoryId, status: "active", lowStock: true })).total).toBe(0);
    await database.db.update(productVariants).set({ stock: 1 });
    expect((await productService.list({ query: "thoi trang", lowStock: true })).total).toBe(1);
  });
  it("creates and selects a size chart", async () => {
    const chart = await productService.createSizeChart({ name: "Bảng áo", columns: ["Size", "Dài"], rows: [["M", "65"]], note: "cm" });
    const saved = await productService.save({ ...input(), sizeChartId: chart.id }, "staff-test");
    expect((await productService.get(saved.id)).values.sizeChartId).toBe(chart.id); expect((await productService.options()).sizeCharts.find((entry) => entry.id === chart.id)?.name).toBe("Bảng áo");
  });
});
