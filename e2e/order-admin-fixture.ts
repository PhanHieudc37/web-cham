import { config } from "dotenv";
import { eq, sql } from "drizzle-orm";
import { createDatabase } from "../src/server/db/client";
import { orderEvents, orderItems, orders, products, productVariants, user } from "../src/server/db/schema";
config({ path: [".env.test.local", ".env"], quiet: true });
const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith("_test")) throw new Error("Chỉ chạy fixture trên _test");
for (const value of [process.env.DATABASE_URL, process.env.DIRECT_URL].filter((entry): entry is string => Boolean(entry))) if (new URL(value).host === new URL(url).host && new URL(value).pathname === new URL(url).pathname) throw new Error("Không sửa dev/prod");
const database = createDatabase(url);
const bankId = "00000000-0000-4000-8000-000000000010", codId = "00000000-0000-4000-8000-000000000011";
try {
  const [variant] = await database.db.select().from(productVariants).where(eq(productVariants.sku, "DETAIL01-DEN-M"));
  if (!variant) throw new Error("Thiếu browsing fixture");
  if (process.argv[2] === "reset") {
    await database.db.execute(sql`TRUNCATE orders, stock_movements CASCADE`);
    await database.db.update(products).set({ status: "active", soldCount: 4 }).where(eq(products.id, variant.productId));
    await database.db.update(productVariants).set({ stock: 5, isActive: true }).where(eq(productVariants.id, variant.id));
    const [actor] = await database.db.select({ id: user.id }).from(user).where(eq(user.email, "staff@example.test"));
    for (let index = 0; index < 27; index++) {
      const id = index === 0 ? bankId : index === 1 ? codId : crypto.randomUUID();
      const quantity = index < 2 ? 2 : 1;
      await database.db.insert(orders).values({ id, code: index === 0 ? "CSBANK10" : index === 1 ? "CSCOD10" : `CSLIST${String(index).padStart(2, "0")}`, idempotencyKey: id, accessTokenHash: "0".repeat(64), customerName: index === 0 ? "Khách chuyển khoản" : index === 1 ? "Khách COD" : "Khách danh sách", customerPhone: index === 0 ? "0912345678" : "0987654321", customerEmail: "customer@example.test", province: "Tỉnh kiểm thử", ward: "Phường kiểm thử", addressLine: "Địa chỉ kiểm thử", note: "Giao hàng giờ hành chính", paymentMethod: index === 0 ? "bank_transfer" : "cod", status: index > 20 ? "confirmed" : "pending", subtotal: quantity * 199000, shippingFee: 30000, total: quantity * 199000 + 30000, createdAt: new Date(Date.now() - index * 60000) });
      await database.db.insert(orderItems).values({ orderId: id, productId: index < 2 ? variant.productId : null, variantId: index < 2 ? variant.id : null, productName: "Áo kiểm thử đơn hàng", productSlug: "ao-thun-chi-tiet", colorName: "Đen", size: "M", sku: variant.sku, unitPrice: 199000, quantity, lineTotal: quantity * 199000, imageUrl: "/images/placeholder.svg" });
      await database.db.insert(orderEvents).values({ orderId: id, type: "created", toStatus: "pending" });
    }
    await database.db.insert(orderEvents).values({ orderId: bankId, type: "note", message: "Đối chiếu ngân hàng trước khi giao", actorId: actor.id });
  } else if (process.argv[2] !== "read") throw new Error("Lệnh fixture chưa hợp lệ");
  const state = await database.db.execute<{ stock: number; cancellations: number; returns: number; notes: number }>(sql`select (select stock from product_variants where id=${variant.id}) as stock, (select count(*)::integer from stock_movements where reason='cancel') as cancellations, (select count(*)::integer from stock_movements where reason='return') as returns, (select count(*)::integer from order_events where type='note') as notes`);
  console.log(JSON.stringify({ bankId, codId, ...state[0] }));
} finally { await database.connection.end(); }
