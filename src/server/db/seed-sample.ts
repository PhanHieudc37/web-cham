import "server-only";

import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { Database } from "./client";
import { banners, categories, collectionProducts, collections, productColors, productImages, products, productVariants, sizeCharts, stockMovements } from "./schema";
import { sampleCategories, sampleProducts } from "./seed-data/sample";

type SeedTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
const placeholder = "/images/placeholder.svg";
function sampleId(key: string) {
  const hex = createHash("sha256").update(`cham-stu:sample:${key}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export async function seedSample(transaction: SeedTransaction) {
  const categoryIds = new Map<string, string>();
  const categoryLabels = new Map<string, string>();
  for (const [parentIndex, parent] of sampleCategories.entries()) {
    await transaction.insert(categories).values({ name: parent.name, slug: parent.slug, sortOrder: parentIndex }).onConflictDoNothing();
    const [parentRow] = await transaction.select({ id: categories.id, name: categories.name }).from(categories).where(eq(categories.slug, parent.slug));
    for (const [childIndex, child] of parent.children.entries()) {
      await transaction.insert(categories).values({ ...child, parentId: parentRow.id, sortOrder: childIndex }).onConflictDoNothing();
      const [childRow] = await transaction.select({ id: categories.id, name: categories.name }).from(categories).where(eq(categories.slug, child.slug));
      categoryIds.set(child.slug, childRow.id);
      categoryLabels.set(child.slug, `${childRow.name} ${parentRow.name}`);
    }
  }

  for (const type of ["shirt", "pants"] as const) {
    await transaction.insert(sizeCharts).values({
      id: sampleId(`size-chart:${type}`), name: type === "shirt" ? "Bảng size áo" : "Bảng size quần",
      columns: ["Size", "Chiều cao", "Cân nặng", type === "shirt" ? "Dài áo" : "Dài quần", type === "shirt" ? "Rộng áo" : "Vòng eo"],
      rows: ["S", "M", "L", "XL"].map((size) => [size, "—", "—", "—", "—"]), note: "Chủ shop cập nhật số đo thật",
    }).onConflictDoNothing();
  }

  const homeProductIds: string[] = [];
  for (const [productIndex, sample] of sampleProducts.entries()) {
    const categoryId = categoryIds.get(sample.categorySlug);
    if (!categoryId) throw new Error("Thiếu danh mục mẫu");
    const searchText = `${sample.name} ${sample.code} ${categoryLabels.get(sample.categorySlug)} ${sample.colors.map((color) => color.name).join(" ")}`
      .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/\s+/g, " ").trim();
    await transaction.insert(products).values({
      code: sample.code, slug: sample.slug, name: sample.name, categoryId, status: "active", price: sample.price,
      compareAtPrice: sample.compareAtPrice, description: "Sản phẩm mẫu để kiểm tra giao diện. Chủ shop thay bằng thông tin thật trước khi mở bán.",
      sizeChartId: sampleId(`size-chart:${sample.categorySlug.startsWith("ao-") ? "shirt" : "pants"}`),
      isNew: sample.isNew, isBestSeller: sample.isBestSeller, sortOrder: productIndex, searchText, publishedAt: new Date(),
    }).onConflictDoNothing();
    const [product] = await transaction.select({ id: products.id }).from(products).where(eq(products.code, sample.code));
    if (productIndex < 4) homeProductIds.push(product.id);
    for (const [colorIndex, color] of sample.colors.entries()) {
      await transaction.insert(productColors).values({ ...color, productId: product.id, sortOrder: colorIndex }).onConflictDoNothing();
      const [savedColor] = await transaction.select({ id: productColors.id }).from(productColors).where(and(eq(productColors.productId, product.id), eq(productColors.code, color.code)));
      for (const size of sample.sizes) {
        const [variant] = await transaction.insert(productVariants).values({
          productId: product.id, colorId: savedColor.id, size, sku: `${sample.code}-${color.code}-${size}`.toUpperCase(), stock: sample.stock,
        }).onConflictDoNothing().returning({ id: productVariants.id });
        if (variant) await transaction.insert(stockMovements).values({ variantId: variant.id, delta: sample.stock, stockAfter: sample.stock, reason: "import", note: "Khởi tạo dữ liệu mẫu" });
      }
    }
    await transaction.insert(productImages).values({
      id: sampleId(`image:${product.id}`), productId: product.id, url: placeholder,
      storagePath: placeholder, alt: sample.name,
    }).onConflictDoNothing();
  }

  await transaction.insert(collections).values({ slug: "thu-dong-2026", title: "THU ĐÔNG 2026", showOnHome: true, showInMenu: true }).onConflictDoNothing();
  const [collection] = await transaction.select({ id: collections.id }).from(collections).where(eq(collections.slug, "thu-dong-2026"));
  await transaction.insert(collectionProducts).values(homeProductIds.map((productId, sortOrder) => ({ collectionId: collection.id, productId, sortOrder }))).onConflictDoNothing();
  await transaction.insert(banners).values({
    id: sampleId("banner"), title: "Banner mẫu", desktopImageUrl: placeholder, desktopImagePath: placeholder,
    mobileImageUrl: placeholder, mobileImagePath: placeholder, alt: "Banner mẫu Cham.stu", href: "/collections/all",
  }).onConflictDoNothing();
}
