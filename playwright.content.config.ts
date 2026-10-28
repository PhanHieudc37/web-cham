import { defineConfig } from "@playwright/test";
import adminConfig from "./playwright.admin.config";
export default defineConfig({ ...adminConfig, testMatch: "content.spec.ts", globalSetup: "./e2e/setup-content.mjs", globalTeardown: "./e2e/teardown-content.mjs", timeout: 120000, expect: { timeout: 20000 },
  webServer: { ...adminConfig.webServer, command: "npm.cmd run dev -- --port 3100", url: "http://localhost:3100", reuseExistingServer: false, timeout: 180000,
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL!, TEST_DATABASE_URL: process.env.TEST_DATABASE_URL!, BETTER_AUTH_URL: "http://localhost:3100", NEXT_PUBLIC_SITE_URL: "http://localhost:3100", BETTER_AUTH_SECRET: "test-e2e-auth-secret-at-least-32-characters", CONTENT_CACHE_PROBE: "1" } },
});
