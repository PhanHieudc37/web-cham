import { defineConfig } from "@playwright/test";
import checkoutConfig from "./playwright.checkout.config";
export default defineConfig({ ...checkoutConfig, testMatch: "support.spec.ts" });
