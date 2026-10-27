import "server-only";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { count, eq, getTableName } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { verifyPassword } from "better-auth/crypto";
import { createDatabase } from "./client";
import * as schema from "./schema";
import { seedDatabase } from "./seed-runner";

const testUrl = process.env.TEST_DATABASE_URL;
const tables = [schema.account, schema.session, schema.user, schema.verification, schema.categories, schema.productColors, schema.productImages,
  schema.productVariants, schema.products, schema.sizeCharts, schema.banners, schema.collectionProducts, schema.collections, schema.orderEvents,
  schema.orderItems, schema.orders, schema.stockMovements, schema.contactMessages, schema.rateLimits, schema.settings];

describe.skipIf(!testUrl)("database migrations and seed", () => {
  let database: ReturnType<typeof createDatabase>;
  const options = {
    sample: true, environment: "test", adminEmail: "admin@example.test", adminPassword: "Private-test-password-12345",
    authSecret: "test-auth-secret-with-at-least-32-characters", authUrl: "http://localhost:3000",
  };

  beforeAll(async () => {
    if (!testUrl) throw new Error("Thiếu TEST_DATABASE_URL");
    const target = new URL(testUrl);
    if (!target.pathname.endsWith("_test")) throw new Error("Database kiểm thử phải có tên kết thúc bằng _test");
    for (const other of [process.env.DATABASE_URL, process.env.DIRECT_URL].filter((value): value is string => Boolean(value))) {
      const parsed = new URL(other);
      if (parsed.host === target.host && parsed.pathname === target.pathname) throw new Error("Không chạy test trên database dev/prod");
    }
    database = createDatabase(testUrl);
    await migrate(database.db, { migrationsFolder: "src/server/db/migrations" });
    await migrate(database.db, { migrationsFolder: "src/server/db/migrations" });
    const names = tables.map((table) => `"${getTableName(table)}"`).join(", ");
    await database.connection.unsafe(`TRUNCATE TABLE ${names} CASCADE`);
  }, 60_000);

  afterAll(async () => { if (database) await database.connection.end(); });

  it("seeds twice without duplicating rows, enables RLS, and hashes the first admin password", async () => {
    const snapshot = async () => Object.fromEntries(await Promise.all(tables.map(async (table) => {
      const [row] = await database.connection.unsafe<{ count: number }[]>(`SELECT count(*)::integer AS count FROM "${getTableName(table)}"`);
      return [getTableName(table), row.count];
    })));
    await seedDatabase(database.db, options);
    const first = await snapshot();
    await seedDatabase(database.db, options);
    expect(await snapshot()).toEqual(first);
    expect(first).toMatchObject({ categories: 12, products: 12, size_charts: 2, collections: 1, collection_products: 4, banners: 1, user: 1, account: 1, settings: 10 });

    const rls = await database.connection<{ name: string; enabled: boolean }[]>`
      SELECT relname AS name, relrowsecurity AS enabled FROM pg_class
      WHERE relnamespace = 'public'::regnamespace AND relkind = 'r'`;
    expect(rls).toHaveLength(20);
    expect(rls.every((row) => row.enabled)).toBe(true);
    const policies = await database.connection`SELECT * FROM pg_policies WHERE schemaname = 'public'`;
    expect(policies).toHaveLength(0);
    const timezoneColumns = await database.connection`
      SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND data_type = 'timestamp without time zone'`;
    expect(timezoneColumns).toHaveLength(0);

    const [admin] = await database.db.select().from(schema.user).where(eq(schema.user.email, options.adminEmail));
    const [account] = await database.db.select().from(schema.account).where(eq(schema.account.userId, admin.id));
    expect(admin.role).toBe("admin");
    expect(account.password).not.toBe(options.adminPassword);
    expect(await verifyPassword({ hash: account.password ?? "", password: options.adminPassword })).toBe(true);

    const [sales] = await database.db.select({ value: count() }).from(schema.products).where(eq(schema.products.isBestSeller, true));
    const [newProducts] = await database.db.select({ value: count() }).from(schema.products).where(eq(schema.products.isNew, true));
    expect(sales.value).toBeGreaterThanOrEqual(4);
    expect(newProducts.value).toBeGreaterThanOrEqual(4);
  }, 60_000);

  it("preserves edited settings, product prices, and stock when rerunning seed", async () => {
    await database.db.update(schema.settings).set({ value: { fee: 45000 } }).where(eq(schema.settings.key, "shipping"));
    await database.db.update(schema.products).set({ price: 100000 }).where(eq(schema.products.code, "SAMPLE01"));
    await database.db.update(schema.productVariants).set({ stock: 7 }).where(eq(schema.productVariants.sku, "SAMPLE01-DEN-S"));
    await seedDatabase(database.db, options);
    const [shipping] = await database.db.select().from(schema.settings).where(eq(schema.settings.key, "shipping"));
    const [product] = await database.db.select().from(schema.products).where(eq(schema.products.code, "SAMPLE01"));
    const [variant] = await database.db.select().from(schema.productVariants).where(eq(schema.productVariants.sku, "SAMPLE01-DEN-S"));
    expect(shipping.value).toEqual({ fee: 45000 });
    expect(product.price).toBe(100000);
    expect(variant.stock).toBe(7);
  });

  it("refuses sample data in production without writing anything", async () => {
    const [before] = await database.db.select({ value: count() }).from(schema.products);
    await expect(seedDatabase(database.db, { ...options, environment: "production" })).rejects.toThrow("production");
    const [after] = await database.db.select({ value: count() }).from(schema.products);
    expect(after.value).toBe(before.value);
  });
});
