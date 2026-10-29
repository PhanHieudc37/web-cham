import { config } from "dotenv";
import { eq, sql } from "drizzle-orm";
import { createDatabase } from "../src/server/db/client";
import { products, productVariants, settings } from "../src/server/db/schema";
import { defaultSettings } from "../src/lib/validation/settings";
config({ path: [".env.test.local", ".env"], quiet: true });
const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith("_test")) throw new Error("Chỉ dùng checkout fixture trên _test");
for (const value of [process.env.DATABASE_URL, process.env.DIRECT_URL].filter((entry): entry is string => Boolean(entry))) {
  const target = new URL(url), other = new URL(value);
  if (other.host === target.host && other.pathname === target.pathname) throw new Error("Không sửa dev/prod");
}
const database = createDatabase(url);
try {
  const [product] = await database.db.select({ id: products.id }).from(products).where(eq(products.code, "DETAIL01"));
  if (!product) throw new Error("Thiếu sản phẩm fixture");
  const [variant] = await database.db.select({ id: productVariants.id }).from(productVariants).where(eq(productVariants.sku, "DETAIL01-DEN-M"));
  if (!variant) throw new Error("Thiếu biến thể fixture");
  switch (process.argv[2]) {
    case "reset":
      await database.db.execute(sql`TRUNCATE orders, stock_movements CASCADE`);
      await database.db.update(products).set({ status: "active", price: 199000, soldCount: 0 }).where(eq(products.id, product.id));
      await database.db.update(productVariants).set({ stock: 2 }).where(eq(productVariants.id, variant.id));
      await database.db.update(settings).set({ value: defaultSettings.shipping }).where(eq(settings.key, "shipping"));
      await database.db.update(settings).set({ value: { bankBin: "970436", bankName: "Ngân hàng kiểm thử", accountNo: "123456789", accountName: "TAI KHOAN KIEM THU" } }).where(eq(settings.key, "bank"));
      break;
    case "price": await database.db.update(products).set({ price: 249000 }).where(eq(products.id, product.id)); break;
    case "empty": await database.db.update(productVariants).set({ stock: 0 }).where(eq(productVariants.id, variant.id)); break;
    case "read": break;
    default: throw new Error("Lệnh fixture không hợp lệ");
  }
  const state = await database.db.execute<{ count: number; total: number; quantity: number; stock: number; movements: number }>(sql`SELECT (SELECT count(*)::integer FROM orders) AS count, (SELECT coalesce(sum(total),0)::integer FROM orders) AS total, (SELECT coalesce(sum(quantity),0)::integer FROM order_items) AS quantity, (SELECT stock FROM product_variants WHERE id=${variant.id}) AS stock, (SELECT count(*)::integer FROM stock_movements WHERE reason='order') AS movements`);
  console.log(JSON.stringify({ ...state[0], variantId: variant.id }));
} finally { await database.connection.end(); }
