import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { createDatabase } from "../src/server/db/client";
import { banners, categories, collectionProducts, collections, productColors, productImages, products, productVariants, settings } from "../src/server/db/schema";
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
  const [sample] = await database.db.select().from(products);
  if (!sample) throw new Error("Thiếu fixture catalog");
  await database.db.update(categories).set({ imageUrl: "/images/placeholder.svg" });
  await database.db.update(products).set({ isNew: true, isBestSeller: true, compareAtPrice: 200000, publishedAt: new Date() });
  for (let index = 3; index <= 9; index++) {
    const id = randomUUID(), colorId = randomUUID();
    await database.db.insert(products).values({ id, code: `SEED0${index}`, name: `Áo kiểm thử ${index}`, slug: `ao-kiem-thu-${index}`, categoryId: sample.categoryId,
      status: index === 9 ? "draft" : "active", price: 130000, compareAtPrice: index === 3 ? 200000 : null, isNew: true, isBestSeller: true, searchText: `ao kiem thu ${index}`, publishedAt: new Date(), sortOrder: index });
    await database.db.insert(productColors).values({ id: colorId, productId: id, name: "Đen", code: "den", hex: "#111111" });
    await database.db.insert(productVariants).values({ productId: id, colorId, size: "M", sku: `SEED0${index}-DEN-M`, stock: index === 8 ? 0 : 5 });
    await database.db.insert(productImages).values({ productId: id, colorId, url: "/images/placeholder.svg", storagePath: "/images/placeholder.svg", alt: `Ảnh áo kiểm thử ${index}` });
  }
  const collectionId = randomUUID();
  await database.db.insert(collections).values({ id: collectionId, slug: "bo-suu-tap-thu", title: "Bộ sưu tập thử", showInMenu: true, showOnHome: true, bannerUrl: "/images/placeholder.svg" });
  await database.db.insert(collectionProducts).values({ collectionId, productId: sample.id });
  await database.db.insert(collections).values({ slug: "bo-suu-tap-rong", title: "Bộ sưu tập rỗng", showOnHome: true, sortOrder: 10 });
  for (let index = 1; index <= 3; index++) await database.db.insert(banners).values({ title: `Banner kiểm thử ${index}`, desktopImageUrl: `/images/placeholder.svg?desktop=${index}`, desktopImagePath: `fixture/desktop-${index}`,
    mobileImageUrl: `/images/placeholder.svg?mobile=${index}`, mobileImagePath: `fixture/mobile-${index}`, alt: `Banner mẫu ${index}`, href: "/collections/all", ctaLabel: `KHÁM PHÁ ${index}`, sortOrder: index,
    startsAt: index === 3 ? new Date(Date.now() + 86400000) : null });
  await database.db.insert(settings).values(Object.entries(defaultSettings).map(([key, value]) => ({ key, value })));
  await database.db.update(settings).set({ value: { ...defaultSettings.shop, description: "Mô tả thương hiệu dùng riêng cho kiểm thử." } }).where(eq(settings.key, "shop"));
  await database.db.update(settings).set({ value: { ...defaultSettings.social, shopee: "" } }).where(eq(settings.key, "social"));
  await database.db.update(settings).set({ value: ["Thông báo kiểm thử một", "Thông báo kiểm thử hai"] }).where(eq(settings.key, "announcements"));
} finally { await database.connection.end(); }
