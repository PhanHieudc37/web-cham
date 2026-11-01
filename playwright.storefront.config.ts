import { defineConfig } from "@playwright/test";
import contentConfig from "./playwright.content.config";

export default defineConfig({ ...contentConfig, testMatch: "storefront.spec.ts", outputDir: "test-results/storefront", globalSetup: "./e2e/setup-storefront.mjs" });
