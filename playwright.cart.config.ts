import { defineConfig } from "@playwright/test";
import browsingConfig from "./playwright.browsing.config";
export default defineConfig({ ...browsingConfig, testMatch: "cart.spec.ts" });
