import { defineConfig } from "@playwright/test";
import contentConfig from "./playwright.content.config";

export default defineConfig({ ...contentConfig, testMatch: "storefront.spec.ts", globalSetup: "./e2e/setup-storefront.mjs" });
