import { defineConfig } from "@playwright/test";
import contentConfig from "./playwright.content.config";
export default defineConfig({ ...contentConfig, testMatch: "browsing.spec.ts", globalSetup: "./e2e/setup-browsing.mjs", globalTeardown: "./e2e/teardown-browsing.mjs" });
