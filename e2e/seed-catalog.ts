import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { createDatabase } from "../src/server/db/client";
import { createCategoryService } from "../src/server/services/category.service";
import { createProductService } from "../src/server/services/product.service";
import { productInputSchema } from "../src/lib/validation/product";
config({ path: [".env.test.local", ".env"], quiet: true });
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) throw new Error("Thiếu TEST_DATABASE_URL");
const target = new URL(testUrl);
if (!target.pathname.endsWith("_test")) throw new Error("Database phải có hậu tố _test");
for (const value of [process.env.DATABASE_URL, process.env.DIRECT_URL].filter((entry): entry is string => Boolean(entry))) {
  const parsed = new URL(value); if (parsed.host === target.host && parsed.pathname === target.pathname) throw new Error("Không seed E2E trên dev/prod");
}
const database = createDatabase(testUrl);
try {
  await database.db.execute(sql`TRUNCATE orders, products, categories, collections, settings, rate_limits, size_charts CASCADE`);
  const service = createCategoryService(database.db, async () => undefined);
  const parent = await service.save({ name: "Áo", slug: "ao", parentId: null, imageUrl: "", imagePath: "", sortOrder: 0, isActive: true });
  const child = await service.save({ name: "Áo thun", slug: "ao-thun", parentId: parent.id, imageUrl: "", imagePath: "", sortOrder: 0, isActive: true });
  await createProductService(database.db, async () => undefined).save(productInputSchema.parse({ name: "Áo kiểm thử", code: "SEED01", slug: "ao-kiem-thu", categoryId: child.id, price: 100000, compareAtPrice: null, status: "active",
    colors: [{ name: "Đen", code: "den", hex: "#111111" }], variants: [{ colorCode: "den", size: "M", sku: "SEED01-DEN-M", stock: 1, isActive: true }], images: [{ url: "/images/placeholder.svg", storagePath: "/images/placeholder.svg", alt: "Ảnh mẫu", colorCode: null }] }), "e2e-test");
  console.log("Đã chuẩn bị catalog trên database E2E riêng.");
} finally { await database.connection.end(); }
