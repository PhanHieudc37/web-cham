import "server-only";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { defaultSettings } from "@/lib/validation/settings";
import { createDatabase } from "@/server/db/client";
import { categories, collectionProducts, products, settings } from "@/server/db/schema";
import { createContentService } from "./content.service";
import { createCategoryService } from "./category.service";
import { createCatalogService } from "./catalog.service";
import { getSetting, readSettings, saveSetting } from "./settings.service";
import { createProductService } from "./product.service";
import { productInputSchema } from "@/lib/validation/product";
const testUrl = process.env.TEST_DATABASE_URL;
describe.skipIf(!testUrl)("collections banners and settings persistence", () => {
  let database: ReturnType<typeof createDatabase>, service: ReturnType<typeof createContentService>;
  let categoryId: string;
  const cleanup = vi.fn(async (paths: string[]) => { void paths; });
  beforeAll(async () => {
    if (!testUrl) throw new Error("Thiếu TEST_DATABASE_URL"); const target = new URL(testUrl);
    if (!target.pathname.endsWith("_test")) throw new Error("Database phải có hậu tố _test");
    for (const value of [process.env.DATABASE_URL, process.env.DIRECT_URL].filter((entry): entry is string => Boolean(entry))) { const url = new URL(value); if (url.host === target.host && url.pathname === target.pathname) throw new Error("Không test trên dev/prod"); }
    database = createDatabase(testUrl); await migrate(database.db, { migrationsFolder: "src/server/db/migrations" }); service = createContentService(database.db, cleanup);
  });
  afterAll(async () => { if (database) await database.connection.end(); });
  beforeEach(async () => { cleanup.mockClear(); await database.db.execute(sql`TRUNCATE collections, banners, products, categories, settings CASCADE`); categoryId = randomUUID(); await database.db.insert(categories).values({ id: categoryId, name: "Áo", slug: "ao" }); });
  const collection = (title = "Bộ sưu tập") => ({ title, description: "", bannerUrl: "", bannerPath: "", isActive: true, showOnHome: true, showInMenu: true, sortOrder: 0, productIds: [] as string[] });
  const banner = (title = "Banner") => ({ title, desktopImageUrl: "/images/placeholder.svg", desktopImagePath: "/images/placeholder.svg", mobileImageUrl: "/images/placeholder.svg", mobileImagePath: "/images/placeholder.svg", alt: "Ảnh", href: "/collections/all", ctaLabel: "MUA NGAY", sortOrder: 0, isActive: true, startsAt: null as string | null, endsAt: null as string | null });
  async function product(code: string) { const id = randomUUID(); await database.db.insert(products).values({ id, code, name: `Áo ${code}`, slug: code.toLowerCase(), categoryId, status: "active", price: 100000, searchText: `ao ${code.toLowerCase()}` }); return id; }
  it("shares slug namespace with categories and reserves automatic collections", async () => {
    for (const slug of ["all", "sale", "best-seller", "new-arrival", "ao"]) await expect(service.saveCollection({ ...collection(), slug })).rejects.toMatchObject({ code: "CONFLICT", fields: { slug: expect.any(String) } });
    const first = await service.saveCollection(collection()), second = await service.saveCollection(collection());
    const rows = await service.listCollections(); expect(rows.find((row) => row.id === first.id)?.slug).toBe("bo-suu-tap"); expect(rows.find((row) => row.id === second.id)?.slug).toBe("bo-suu-tap-2");
    await expect(createCategoryService(database.db, cleanup).save({ name: "Trùng", slug: "bo-suu-tap", parentId: null, imageUrl: "", imagePath: "", sortOrder: 0, isActive: true })).rejects.toMatchObject({ code: "CONFLICT" });
    await service.saveCollection({ ...rows.find((row) => row.id === first.id)!, description: "Đã sửa" });
  });
  it("preserves selected product order and supports picker search/pagination", async () => {
    const first = await product("TEE01"), second = await product("TEE02");
    const result = await service.saveCollection({ ...collection(), productIds: [second, first] });
    expect((await service.listCollections())[0]).toMatchObject({ productIds: [second, first], productCount: 2 });
    expect((await service.productChoices("ÁO TEE01")).products[0].id).toBe(first);
    expect((await service.productChoices("", [first])).products).toHaveLength(1);
    await service.saveCollection({ ...collection(), id: result.id, productIds: [first] });
    expect(await database.db.select().from(collectionProducts)).toHaveLength(1);
  });
  it("rejects deleted product ids atomically", async () => {
    await expect(service.saveCollection({ ...collection(), productIds: [randomUUID()] })).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(await service.listCollections()).toHaveLength(0);
  });
  it("toggles collection visibility/menu/home and safely deletes links", async () => {
    const id = await product("TEE01"), result = await service.saveCollection({ ...collection(), productIds: [id] });
    expect((await createCatalogService(database.db).getMenu()).collections).toHaveLength(1);
    await service.saveCollection({ ...collection(), id: result.id, productIds: [id], isActive: false });
    expect((await createCatalogService(database.db).getMenu()).collections).toHaveLength(0);
    await service.deleteCollection(result.id); expect(await database.db.select().from(collectionProducts)).toHaveLength(0); expect(await database.db.select().from(products)).toHaveLength(1);
  });
  it("stores schedules, filters expired/future banners, reorders and deletes", async () => {
    const now = Date.now();
    const first = await service.saveBanner(banner("Đang chạy"));
    await service.saveBanner({ ...banner("Tương lai"), startsAt: new Date(now + 86400000).toISOString() });
    await service.saveBanner({ ...banner("Hết hạn"), endsAt: new Date(now - 86400000).toISOString() });
    expect((await createCatalogService(database.db).getHome()).banners.map((row) => row.title)).toEqual(["Đang chạy"]);
    const second = await service.saveBanner(banner("Banner hai")); await service.reorder("banners", second.id, "up");
    expect((await service.listBanners()).findIndex((row) => row.id === second.id)).toBeLessThan(3);
    await service.deleteBanner(first.id); expect((await service.listBanners()).some((row) => row.id === first.id)).toBe(false);
  });
  it("checks Storage URL/path and cleans replaced images only after commit", async () => {
    const root = process.env.SUPABASE_URL ?? "https://example.supabase.co", path = `banners/2026/10/${randomUUID()}.webp`, url = `${root}/storage/v1/object/public/media/${path}`;
    const result = await service.saveBanner({ ...banner(), desktopImagePath: path, desktopImageUrl: url });
    await service.saveBanner({ ...banner(), id: result.id }); expect(cleanup).toHaveBeenLastCalledWith([path]);
    await expect(service.saveBanner({ ...banner(), desktopImageUrl: "https://evil.test/image.png", desktopImagePath: path })).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
  it("saves settings keys independently with server validation and actor metadata", async () => {
    await saveSetting("shop", { ...defaultSettings.shop, phone: "0912345678" }, "test-admin", database.db, cleanup);
    await saveSetting("shipping", { fee: 45000, freeShipMinItems: null, freeShipMinAmount: 500000 }, "test-admin", database.db, cleanup);
    expect((await readSettings(database.db)).shop.phone).toBe("0912345678"); expect((await getSetting("shipping", database.db)).fee).toBe(45000);
    expect((await database.db.select().from(settings).where(eq(settings.key, "shipping")))[0].updatedBy).toBe("test-admin");
    await expect(saveSetting("shipping", { fee: -1, freeShipMinItems: null, freeShipMinAmount: null }, "test-admin", database.db, cleanup)).rejects.toBeDefined();
    expect((await getSetting("shipping", database.db)).fee).toBe(45000);
  });
  it("normalizes bank names and removes replaced settings images after commit", async () => {
    await saveSetting("bank", { bankBin: "970436", bankName: "Vietcombank", accountNo: "123456", accountName: "Nguyễn Đỏ" }, "test-admin", database.db, cleanup);
    expect((await getSetting("bank", database.db)).accountName).toBe("NGUYEN DO");
    const path = `settings/2026/10/${randomUUID()}.webp`, url = `${process.env.SUPABASE_URL}/storage/v1/object/public/media/${path}`;
    await saveSetting("shop", { ...defaultSettings.shop, logoUrl: url }, "test-admin", database.db, cleanup);
    await saveSetting("shop", defaultSettings.shop, "test-admin", database.db, cleanup); expect(cleanup).toHaveBeenLastCalledWith([path]);
  });
  it("keeps manual collection order when a product is edited", async () => {
    const productService = createProductService(database.db, cleanup);
    const make = (code: string) => productInputSchema.parse({ code, name: `Áo ${code}`, categoryId, price: 100000, compareAtPrice: null, status: "draft", colors: [{ name: "Đen", code: "den", hex: "#111111" }], variants: [{ colorCode: "den", size: "M", sku: `${code}-DEN-M`, stock: 1 }] });
    const first = await productService.save(make("EDIT01"), "staff-test"), second = await productService.save(make("EDIT02"), "staff-test");
    const saved = await service.saveCollection({ ...collection(), productIds: [second.id, first.id] });
    const values = (await productService.get(first.id)).values;
    await productService.save({ ...values, name: "Áo đã sửa" }, "staff-test");
    expect((await service.listCollections()).find((row) => row.id === saved.id)?.productIds).toEqual([second.id, first.id]);
  });
});
