import "server-only";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDatabase } from "@/server/db/client";
import { categories, collections, products } from "@/server/db/schema";
import { readSitemap } from "./seo.service";
const url = process.env.TEST_DATABASE_URL;
describe.skipIf(!url)("sitemap visibility on isolated PostgreSQL", () => {
  let database: ReturnType<typeof createDatabase>;
  beforeAll(async () => {
    if (!url || !new URL(url).pathname.endsWith("_test")) throw new Error("Chỉ dùng database _test");
    for (const other of [process.env.DATABASE_URL, process.env.DIRECT_URL].filter((value): value is string => Boolean(value))) if (new URL(other).host === new URL(url).host && new URL(other).pathname === new URL(url).pathname) throw new Error("Không dùng dev/prod");
    database = createDatabase(url); await migrate(database.db, { migrationsFolder: "src/server/db/migrations" });
  }, 60000);
  afterAll(async () => { if (database) await database.connection.end(); });
  it("lists every visible active product/category/collection and excludes private/draft/hidden routes", async () => {
    await database.db.execute(sql`TRUNCATE products, categories, collections CASCADE`);
    const active = randomUUID(), hidden = randomUUID(), child = randomUUID();
    await database.db.insert(categories).values([{ id: active, name: "Hiện", slug: "hien" }, { id: hidden, name: "Ẩn", slug: "an", isActive: false }]);
    await database.db.insert(categories).values({ id: child, parentId: hidden, name: "Con ẩn", slug: "con-an" });
    await database.db.insert(collections).values([{ title: "Hiện", slug: "bo-hien" }, { title: "Ẩn", slug: "bo-an", isActive: false }]);
    await database.db.insert(products).values([
      { name: "Bán", slug: "dang-ban", code: "ACTIVE", categoryId: active, status: "active", price: 100000, searchText: "ban" },
      { name: "Nháp", slug: "nhap", code: "DRAFT", categoryId: active, status: "draft", price: 100000, searchText: "nhap" },
      { name: "Ẩn", slug: "nhom-an", code: "HIDDEN", categoryId: child, status: "active", price: 100000, searchText: "an" },
    ]);
    const rows = await readSitemap(database.db, "https://shop.example.test"); const paths = rows.map((row) => new URL(row.url).pathname);
    expect(paths).toEqual(expect.arrayContaining(["/", "/products/dang-ban", "/collections/hien", "/collections/bo-hien", "/collections/all", "/gioi-thieu", "/lien-he", "/chinh-sach-bao-mat"]));
    for (const path of ["/products/nhap", "/products/nhom-an", "/collections/an", "/collections/con-an", "/collections/bo-an", "/admin", "/cart", "/checkout", "/kiem-tra-don-hang"]) expect(paths).not.toContain(path);
    expect(new Set(paths).size).toBe(paths.length); expect(rows.find((row) => row.url.endsWith("/products/dang-ban"))?.lastModified).toBeInstanceOf(Date);
  });
});
