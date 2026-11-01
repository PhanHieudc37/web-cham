import { defineConfig } from "@playwright/test";
import production from "./playwright.production.config";
export default defineConfig({ ...production, testMatch: "performance.spec.ts", outputDir: "test-results/phase15b-performance" });
