import { defineConfig } from "@playwright/test";
import browsingConfig from "./playwright.browsing.config";
const server = browsingConfig.webServer;
if (!server || Array.isArray(server)) throw new Error("Checkout E2E cần một webServer kiểm thử");
export default defineConfig({ ...browsingConfig, testMatch: "checkout.spec.ts", webServer: { ...server, env: { ...server.env, RESEND_API_KEY: "", EMAIL_FROM: "", SHOP_NOTIFY_EMAIL: "", TELEGRAM_BOT_TOKEN: "", TELEGRAM_CHAT_ID: "" } } });
