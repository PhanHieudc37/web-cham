import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDatabase } from "../src/server/db/client";
import { createAuth } from "../src/server/auth/auth";

config({ path: [".env.test.local", ".env"], quiet: true });
const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) throw new Error("Thiếu TEST_DATABASE_URL");
const target = new URL(testUrl);
if (!target.pathname.endsWith("_test")) throw new Error("Database phải có hậu tố _test");
for (const other of [process.env.DATABASE_URL, process.env.DIRECT_URL].filter((value): value is string => Boolean(value))) {
  const parsed = new URL(other); if (parsed.host === target.host && parsed.pathname === target.pathname) throw new Error("Không chạy seed E2E trên database dev/prod");
}
const database = createDatabase(testUrl);
try {
  await migrate(database.db, { migrationsFolder: "src/server/db/migrations" });
  await database.db.execute(sql`TRUNCATE "user", rate_limits CASCADE`);
  const auth = createAuth(database.db, { baseURL: "http://localhost:3100", secret: "test-e2e-auth-secret-at-least-32-characters" });
  for (const role of ["admin", "staff"] as const) await auth.api.createUser({ body: { name: role === "admin" ? "Quản trị kiểm thử" : "Nhân viên kiểm thử", email: `${role}@example.test`, password: "E2e-private-password-12345", role } });
  console.log("Đã chuẩn bị tài khoản E2E trên database kiểm thử riêng.");
} finally { await database.connection.end(); }
