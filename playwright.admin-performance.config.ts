import { defineConfig } from "@playwright/test";
import production from "./playwright.production.config";
export default defineConfig({ ...production, testMatch: "admin-performance.spec.ts", outputDir: "test-results/phase15c-admin" });
