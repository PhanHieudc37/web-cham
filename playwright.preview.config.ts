import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e-preview",
  fullyParallel: false,
  reporter: "list",
  use: { baseURL: process.env.PREVIEW_TEST_URL ?? "http://127.0.0.1:4173/web-cham/", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PREVIEW_TEST_URL ? undefined : {
    command: "npm run preview:dev",
    url: "http://127.0.0.1:4173/web-cham/",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
