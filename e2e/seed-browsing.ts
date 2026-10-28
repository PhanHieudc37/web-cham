import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { createDatabase } from "../src/server/db/client";
import { categories, productColors, productImages, products, productVariants, settings, sizeCharts } from "../src/server/db/schema";
import { defaultSettings } from "../src/lib/validation/settings";
config({ path: [".env.test.local", ".env"], quiet: true });
const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith("_test")) throw new Error("Database phải có hậu tố _test");
for (const value of [process.env.DATABASE_URL, process.env.DIRECT_URL].filter((entry): entry is string => Boolean(entry))) {
  const other = new URL(value), target = new URL(url);
  if (other.host === target.host && other.pathname === target.pathname) throw new Error("Không seed trên dev/prod");
}
const database = createDatabase(url);
try {
  const [category] = await database.db.select().from(categories).where(eq(categories.slug, "ao-thun"));
  if (!category) throw new Error("Thiếu fixture danh mục");
  const chartId = randomUUID(), id = randomUUID(), black = randomUUID(), white = randomUUID(), green = randomUUID();
  await database.db.insert(sizeCharts).values({ id: chartId, name: "Bảng size áo thun thử", columns: ["Size", "Dài áo (cm)", "Rộng áo (cm)"], rows: [["M", "68", "52"], ["L", "70", "54"], ["XL", "72", "56"]], note: "Số đo dùng riêng cho kiểm thử." });
  await database.db.insert(products).values({ id, categoryId: category.id, code: "DETAIL01", slug: "ao-thun-hai-mau", name: "Áo thun hai màu", status: "active", price: 199000, compareAtPrice: 299000,
    description: "Áo thun dùng cho kiểm thử giao diện.\nMô tả xuống dòng được giữ nguyên.", material: "Cotton", fit: "Oversize", care: ["Giặt với nước lạnh", "Phơi ở nơi thoáng mát"], sizeChartId: chartId, isNew: true, isBestSeller: true, searchText: "ao thun hai mau detail01 ao den trang xanh", sortOrder: -10 });
  await database.db.insert(productColors).values([{ id: black, productId: id, name: "Đen", code: "den", hex: "#111111", sortOrder: 0 }, { id: white, productId: id, name: "Trắng", code: "trang", hex: "#ffffff", sortOrder: 1 }, { id: green, productId: id, name: "Xanh", code: "xanh", hex: "#35764c", sortOrder: 2 }]);
  await database.db.insert(productVariants).values([
    { productId: id, colorId: black, size: "M", stock: 2, sku: "DETAIL01-DEN-M" }, { productId: id, colorId: black, size: "L", stock: 0, sku: "DETAIL01-DEN-L" }, { productId: id, colorId: black, size: "XL", stock: 5, sku: "DETAIL01-DEN-XL" },
    { productId: id, colorId: white, size: "M", stock: 0, sku: "DETAIL01-TRANG-M" }, { productId: id, colorId: white, size: "L", stock: 4, sku: "DETAIL01-TRANG-L" }, { productId: id, colorId: white, size: "XL", stock: 10, sku: "DETAIL01-TRANG-XL", isActive: false },
    { productId: id, colorId: green, size: "M", stock: 0, sku: "DETAIL01-XANH-M" },
  ]);
  await database.db.insert(productImages).values([
    { productId: id, url: "/images/phase7-tests/detail.svg", storagePath: "fixture/detail.svg", alt: "Ảnh toàn bộ áo thun", sortOrder: 0 },
    { productId: id, colorId: black, url: "/images/phase7-tests/black.svg", storagePath: "fixture/black.svg", alt: "Áo thun màu đen", sortOrder: 1 },
    { productId: id, colorId: white, url: "/images/phase7-tests/white.svg", storagePath: "fixture/white.svg", alt: "Áo thun màu trắng", sortOrder: 2 },
  ]);
  for (let index = 10; index <= 26; index++) {
    const productId = randomUUID(), colorId = randomUUID();
    const status = index === 25 ? "draft" : index === 26 ? "archived" : "active";
    await database.db.insert(products).values({ id: productId, code: `BROWSE${index}`, slug: `ao-thun-${index}`, name: `Áo thun ${index}`, categoryId: category.id, status, price: index * 10000, searchText: `ao thun ${index}`, sortOrder: index, publishedAt: new Date() });
    await database.db.insert(productColors).values({ id: colorId, productId, name: "Đen", code: "den", hex: "#111111" });
    await database.db.insert(productVariants).values({ productId, colorId, size: "M", sku: `BROWSE${index}-DEN-M`, stock: index === 24 ? 0 : 5 });
    await database.db.insert(productImages).values({ productId, colorId, url: "/images/phase7-tests/black.svg", storagePath: "fixture/black.svg", alt: `Áo thun ${index}` });
  }
  const hiddenId = randomUUID();
  await database.db.insert(categories).values([{ id: hiddenId, slug: "nhom-an", name: "Nhóm ẩn", isActive: false }, { slug: "nhom-rong", name: "Nhóm rỗng" }]);
  await database.db.insert(products).values({ code: "HIDDEN01", slug: "ao-trong-nhom-an", name: "Áo nhóm ẩn", categoryId: hiddenId, status: "active", price: 100000, searchText: "ao nhom an" });
  await database.db.update(settings).set({ value: "Đổi trả theo chính sách kiểm thử của shop." }).where(eq(settings.key, "returnPolicySummary"));
  await database.db.update(settings).set({ value: { ...defaultSettings.shop, zaloPhone: "0900000000" } }).where(eq(settings.key, "shop"));
} finally { await database.connection.end(); }
