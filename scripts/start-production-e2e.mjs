import { config } from "dotenv";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createImages } from "../e2e/browsing-fixtures.mjs";

config({ path: [".env.test.local", ".env"], quiet: true });
const database = process.env.TEST_DATABASE_URL;
if (!database || !new URL(database).pathname.endsWith("_test")) throw new Error("Production E2E chỉ dùng database _test");
for (const value of [process.env.DATABASE_URL, process.env.DIRECT_URL].filter(Boolean)) if (new URL(value).host === new URL(database).host && new URL(value).pathname === new URL(database).pathname) throw new Error("Không chạy E2E trên database dev/prod");
for (const path of ["src/app/api/phase5-cache-probe/route.ts", "src/app/(shop)/phase7-error-probe/page.tsx"]) if (existsSync(path)) throw new Error("Cần dọn probe từ bộ test trước khi build production E2E");
// Seeds replace product IDs. A previous build's Data Cache must not survive them.
const buildCache = resolve(".next/cache");
if (existsSync(buildCache)) {
  if (realpathSync(buildCache) !== buildCache || !buildCache.startsWith(resolve(process.cwd()) + "/") && !buildCache.startsWith(resolve(process.cwd()) + "\\")) throw new Error("Cache phải nằm trong workspace hiện tại");
  rmSync(buildCache, { recursive: true });
}
async function run(args, env = process.env) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { env, stdio: "inherit", windowsHide: true });
    child.on("error", reject); child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`Lệnh kiểm thử thất bại (exit ${code})`)));
  });
}
for (const name of ["admin", "catalog", "content", "storefront", "browsing"]) await run(["--conditions=react-server", "--import=tsx", `e2e/seed-${name}.ts`]);
// Checkout is prerendered: payment settings must exist before next build.
await run(["--conditions=react-server", "--import=tsx", "e2e/checkout-fixture.ts", "reset"]);
createImages(); mkdirSync("test-results", { recursive: true }); writeFileSync("test-results/phase12-notifications.jsonl", "");
const env = { ...process.env, NODE_ENV: "production", PHASE12_E2E: "1", DATABASE_URL: database, DIRECT_URL: database, NEXT_PUBLIC_SITE_URL: "http://localhost:3100", BETTER_AUTH_URL: "http://localhost:3100", BETTER_AUTH_SECRET: "test-e2e-auth-secret-at-least-32-characters", SUPABASE_SERVICE_ROLE_KEY: "phase12-test-only-no-storage-access", RESEND_API_KEY: "phase12-test-only-no-real-email", EMAIL_FROM: "Cham.stu <sender@example.test>", SHOP_NOTIFY_EMAIL: "shop@example.test", TELEGRAM_BOT_TOKEN: "", TELEGRAM_CHAT_ID: "" };
await run(["node_modules/next/dist/bin/next", "build"], env);
await run(["--import=./e2e/production-notifications.mjs", "node_modules/next/dist/bin/next", "start", "--port", "3100"], env);
