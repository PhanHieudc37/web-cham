import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e", testMatch: "production.spec.ts", outputDir: "test-results/phase12-production", fullyParallel: false, workers: 1, timeout: 120000,
  expect: { timeout: 20000 }, reporter: "list", globalTeardown: "./e2e/teardown-browsing.mjs",
  use: { baseURL: "http://localhost:3100", actionTimeout: 20000, navigationTimeout: 30000, trace: "retain-on-failure" }, projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: { command: "node scripts/start-production-e2e.mjs", url: "http://localhost:3100", reuseExistingServer: false, timeout: 600000 },
});
