import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { createDatabase } from "../src/server/db/client";
import { products, productVariants, settings } from "../src/server/db/schema";
import { defaultSettings } from "../src/lib/validation/settings";

config({ path: [".env.test.local", ".env"], quiet: true });
const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith("_test")) throw new Error("Chỉ sửa fixture trên database _test");
for (const value of [process.env.DATABASE_URL, process.env.DIRECT_URL].filter((entry): entry is string => Boolean(entry))) {
  const target = new URL(url), other = new URL(value);
  if (other.host === target.host && other.pathname === target.pathname) throw new Error("Không sửa dev/prod");
}
const database = createDatabase(url);
try {
  const [product] = await database.db.select({ id: products.id }).from(products).where(eq(products.code, "DETAIL01"));
  if (!product) throw new Error("Thiếu fixture Phase 7");
  const variants = await database.db.select({ id: productVariants.id, sku: productVariants.sku }).from(productVariants).where(eq(productVariants.productId, product.id));
  const black = variants.find((variant) => variant.sku === "DETAIL01-DEN-M")!;
  switch (process.argv[2]) {
    case "reset":
      await database.db.update(products).set({ price: 199000, status: "active" }).where(eq(products.id, product.id));
      await database.db.update(productVariants).set({ stock: 2, isActive: true }).where(eq(productVariants.id, black.id));
      await database.db.update(settings).set({ value: defaultSettings.shipping }).where(eq(settings.key, "shipping"));
      break;
    case "reduce": await database.db.update(productVariants).set({ stock: 1 }).where(eq(productVariants.id, black.id)); break;
    case "empty": await database.db.update(productVariants).set({ stock: 0 }).where(eq(productVariants.id, black.id)); break;
    case "archive": await database.db.update(products).set({ status: "archived" }).where(eq(products.id, product.id)); break;
    case "amount-shipping": await database.db.update(settings).set({ value: { fee: 45000, freeShipMinItems: null, freeShipMinAmount: 500000 } }).where(eq(settings.key, "shipping")); break;
    case "read": break;
    default: throw new Error("Lệnh fixture không hợp lệ");
  }
  console.log(JSON.stringify({ productId: product.id, blackId: black.id, whiteId: variants.find((variant) => variant.sku === "DETAIL01-TRANG-L")!.id }));
} finally { await database.connection.end(); }
