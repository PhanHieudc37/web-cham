import { defineConfig } from "@playwright/test";
import adminConfig from "./playwright.admin.config";
export default defineConfig({ ...adminConfig, testMatch: "catalog.spec.ts", globalSetup: "./e2e/setup-catalog.mjs", timeout: 120000, expect: { timeout: 20000 } });
