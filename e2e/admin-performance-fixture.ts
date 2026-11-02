import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { eq, sql } from "drizzle-orm";
import { createDatabase } from "../src/server/db/client";
import { categories, contactMessages, orderItems, orders, products, productVariants } from "../src/server/db/schema";

config({ path: [".env.test.local", ".env"], quiet: true });
const target = process.env.TEST_DATABASE_URL;
if (!target || !new URL(target).pathname.endsWith("_test")) throw new Error("Only a dedicated _test database is allowed");
for (const value of [process.env.DATABASE_URL, process.env.DIRECT_URL].filter((entry): entry is string => Boolean(entry))) {
  if (new URL(value).host === new URL(target).host && new URL(value).pathname === new URL(target).pathname) throw new Error("Never modify shop data");
}
const database = createDatabase(target);
try {
  const [product] = await database.db.select().from(products).where(eq(products.code, "DETAIL01"));
  const [variant] = await database.db.select().from(productVariants).where(eq(productVariants.sku, "DETAIL01-DEN-M"));
  if (!product || !variant) throw new Error("Missing isolated browsing fixture");
  if (process.argv[2] === "reset") {
    await database.db.execute(sql`TRUNCATE orders, contact_messages, stock_movements CASCADE`);
    await database.db.update(categories).set({ isActive: true }).where(eq(categories.id, product.categoryId));
    const id = randomUUID();
    await database.db.insert(orders).values({ id, code: `PERF${id.replaceAll("-", "").slice(0, 16).toUpperCase()}`, idempotencyKey: id, accessTokenHash: "0".repeat(64), customerName: "Khách kiểm thử admin", customerPhone: "0912345678", province: "Tỉnh kiểm thử", ward: "Phường kiểm thử", addressLine: "Địa chỉ kiểm thử", paymentMethod: "bank_transfer", subtotal: 199000, shippingFee: 30000, total: 229000 });
    await database.db.insert(orderItems).values({ orderId: id, productId: product.id, variantId: variant.id, productName: product.name, productSlug: product.slug, colorName: "Đen", size: "M", sku: variant.sku, imageUrl: "/images/phase7-tests/detail.svg", unitPrice: 199000, quantity: 1, lineTotal: 199000 });
    await database.db.insert(contactMessages).values({ name: "Lời nhắn kiểm thử admin", phone: "0912345678", message: "Nội dung chỉ dùng trong database kiểm thử." });
  } else if (process.argv[2] !== "read") throw new Error("Invalid fixture command");
  const [order] = await database.db.select({ orderId: orders.id, code: orders.code, status: orders.status, paymentStatus: orders.paymentStatus }).from(orders).limit(1);
  const [message] = await database.db.select({ messageId: contactMessages.id, messageStatus: contactMessages.status }).from(contactMessages).limit(1);
  const [category] = await database.db.select({ categoryId: categories.id, categoryName: categories.name, categoryActive: categories.isActive }).from(categories).where(eq(categories.id, product.categoryId));
  console.log(JSON.stringify({ ...order, ...message, ...category, productId: product.id }));
} finally { await database.connection.end(); }
