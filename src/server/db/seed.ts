import "server-only";

import { config } from "dotenv";
import { getSeedEnv } from "@/server/env";
import { createDatabase } from "./client";
import { assertSeedAllowed, seedDatabase } from "./seed-runner";

config({ path: ".env", quiet: true });
const sample = process.argv.includes("--sample");
const environment = process.env.NODE_ENV ?? "development";
assertSeedAllowed({ sample, environment });
const env = getSeedEnv();
const { db, connection } = createDatabase(env.DATABASE_URL);

try {
  await seedDatabase(db, {
    sample, environment, adminEmail: env.ADMIN_SEED_EMAIL, adminPassword: env.ADMIN_SEED_PASSWORD,
    authSecret: env.BETTER_AUTH_SECRET, authUrl: env.BETTER_AUTH_URL,
  });
  console.log(sample ? "Đã khởi tạo cài đặt, admin và dữ liệu mẫu." : "Đã khởi tạo cài đặt và admin.");
} catch {
  console.error("Seed thất bại. Kiểm tra kết nối database và cấu hình admin; thông tin nhạy cảm không được ghi log.");
  process.exitCode = 1;
} finally {
  await connection.end();
}
