import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

config({ path: [".env.test.local", ".env"], quiet: true });
const testDatabase = process.env.TEST_DATABASE_URL;
if (!testDatabase) throw new Error("Cần TEST_DATABASE_URL riêng để chạy E2E admin");
const target = new URL(testDatabase);
if (!target.pathname.endsWith("_test")) throw new Error("E2E chỉ chạy trên database có hậu tố _test");
for (const other of [process.env.DATABASE_URL, process.env.DIRECT_URL].filter((value): value is string => Boolean(value))) {
  const parsed = new URL(other);
  if (parsed.host === target.host && parsed.pathname === target.pathname) throw new Error("Không chạy E2E trên database dev/prod");
}
export default defineConfig({
  testDir: "./e2e", testMatch: "admin.spec.ts", fullyParallel: false, workers: 1, timeout: 60000,
  expect: { timeout: 15000 },
  globalSetup: "./e2e/setup-admin.mjs", reporter: "list",
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: "npm.cmd run dev -- --port 3100", url: "http://localhost:3100", reuseExistingServer: false, timeout: 180000,
    env: { DATABASE_URL: testDatabase, BETTER_AUTH_URL: "http://localhost:3100", NEXT_PUBLIC_SITE_URL: "http://localhost:3100", BETTER_AUTH_SECRET: "test-e2e-auth-secret-at-least-32-characters" } },
});
