import { config } from "dotenv";
import { createDatabase } from "../src/server/db/client";
import { products, productColors, productVariants } from "../src/server/db/schema";
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
config({ path: [".env.test.local", ".env"], quiet: true });
const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith("_test")) throw new Error("Database phải có hậu tố _test");
for (const value of [process.env.DATABASE_URL, process.env.DIRECT_URL].filter((entry): entry is string => Boolean(entry))) { const other = new URL(value), target = new URL(url); if (other.host === target.host && other.pathname === target.pathname) throw new Error("Không seed trên dev/prod"); }
const database = createDatabase(url);
try {
  await database.db.execute(sql`TRUNCATE banners CASCADE`);
  const [sample] = await database.db.select().from(products); if (!sample) throw new Error("Thiếu catalog fixture");
  const id = randomUUID(), color = randomUUID();
  await database.db.insert(products).values({ id, code: "SEED02", name: "Áo kiểm thử hai", slug: "ao-kiem-thu-hai", categoryId: sample.categoryId, status: "active", price: 120000, searchText: "ao kiem thu hai seed02" });
  await database.db.insert(productColors).values({ id: color, productId: id, name: "Trắng", code: "trang", hex: "#ffffff" });
  await database.db.insert(productVariants).values({ productId: id, colorId: color, size: "L", sku: "SEED02-TRANG-L", stock: 5 });
} finally { await database.connection.end(); }
