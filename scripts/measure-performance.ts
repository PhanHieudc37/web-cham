import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { parse } from "dotenv";
import { chromium, type Page, type Request, type Response } from "@playwright/test";
import { z } from "zod";
import { isApplicationRequest, type PerformanceSample } from "../src/lib/performance-measurement";
import { performanceReport, type Measurement } from "./performance-report";

const cli = parseArgs({ options: { stage: { type: "string", default: "baseline" }, network: { type: "string" }, credits: { type: "string", default: "chưa đọc được — chờ chủ shop cung cấp" } } });
const stage = z.enum(["baseline", "15A"]).parse(cli.values.stage);
const network = z.string().trim().min(1).max(150).parse(cli.values.network);
const env = z.object({ NEXT_PUBLIC_SITE_URL: z.url(), ADMIN_SEED_EMAIL: z.email(), ADMIN_SEED_PASSWORD: z.string().min(1) }).parse(parse(readFileSync(".env.deploy.local")));
const origin = new URL(env.NEXT_PUBLIC_SITE_URL).origin;
if (!origin.startsWith("https://")) throw new Error("Chỉ đo production HTTPS trong .env.deploy.local.");
const measurements: Measurement[] = [];
const browser = await chromium.launch();
const publicContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const adminContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const publicPage = await publicContext.newPage(), adminPage = await adminContext.newPage();
let currentLabel = "khởi tạo";
let commit = "chưa xác minh";
let hasFailures = false;
let currentStep = "khởi tạo";

function observe(page: Page) {
  const requests: Request[] = [], responses: Response[] = [];
  const onRequest = (request: Request) => { if (isApplicationRequest(request.url(), origin, request.resourceType())) requests.push(request); };
  const onResponse = (response: Response) => { if (isApplicationRequest(response.url(), origin, response.request().resourceType())) responses.push(response); };
  page.on("request", onRequest); page.on("response", onResponse);
  return { requests, responses, stop() { page.off("request", onRequest); page.off("response", onResponse); } };
}

async function heading(page: Page, admin: boolean) {
  await page.locator(admin ? "main h1" : "#shop-main h1").first().waitFor({ state: "visible", timeout: 45000 });
}

async function measurePage(page: Page, path: string, round: number): Promise<PerformanceSample> {
  const tracker = observe(page), start = performance.now();
  try {
    const response = await page.goto(origin + path, { waitUntil: "commit", timeout: 60000 });
    if (!response?.ok()) throw new Error("Page status is not OK");
    await heading(page, path.startsWith("/admin"));
    const contentMs = performance.now() - start;
    const ttfbMs = await page.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      return navigation ? navigation.responseStart - navigation.startTime : null;
    });
    await page.waitForTimeout(1000);
    const headers = response.headers();
    return { round, ttfbMs, contentMs, appRequests: tracker.requests.length, status: response.status(), cacheStatus: headers["cache-status"] ?? null, age: headers.age ?? null };
  } finally { tracker.stop(); }
}

async function login(round: number): Promise<PerformanceSample> {
  currentStep = "mở form login";
  await adminContext.clearCookies();
  await adminPage.goto(origin + "/admin/login", { waitUntil: "load", timeout: 60000 });
  await adminPage.getByLabel("Email", { exact: true }).fill(env.ADMIN_SEED_EMAIL);
  await adminPage.getByLabel("Mật khẩu", { exact: true }).fill(env.ADMIN_SEED_PASSWORD);
  const tracker = observe(adminPage), start = performance.now();
  try {
    const responsePromise = adminPage.waitForResponse((response) => new URL(response.url()).pathname === "/admin/login" && response.request().method() === "POST" && Boolean(response.request().headers()["next-action"]));
    currentStep = "gửi login";
    await adminPage.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    const response = await responsePromise;
    if (!response.ok()) throw new Error("Login failed");
    currentStep = "chờ redirect sau login";
    await adminPage.waitForURL(origin + "/admin", { timeout: 60000 });
    currentStep = "chờ heading tổng quan";
    await heading(adminPage, true);
    const contentMs = performance.now() - start, timing = response.request().timing();
    await adminPage.waitForTimeout(1000);
    const headers = response.headers();
    return { round, ttfbMs: timing.responseStart < 0 ? null : timing.responseStart, contentMs, appRequests: tracker.requests.length, status: response.status(), cacheStatus: headers["cache-status"] ?? null, age: headers.age ?? null };
  } finally { tracker.stop(); }
}

async function back(round: number): Promise<PerformanceSample> {
  await adminPage.goto(origin + "/admin/orders", { waitUntil: "load", timeout: 60000 });
  await heading(adminPage, true);
  await adminPage.locator('aside a[href="/admin/products"]').click();
  await adminPage.waitForURL(origin + "/admin/products");
  await heading(adminPage, true);
  const tracker = observe(adminPage), start = performance.now();
  try {
    const response = await adminPage.goBack({ waitUntil: "commit", timeout: 60000 });
    await adminPage.waitForURL(origin + "/admin/orders");
    await adminPage.locator("main h1").filter({ hasText: /^Đơn hàng$/ }).waitFor();
    const contentMs = performance.now() - start;
    await adminPage.waitForTimeout(1000);
    const networkResponse = response ?? tracker.responses.find((item) => new URL(item.url()).pathname === "/admin/orders");
    const timing = networkResponse?.request().timing(), headers = networkResponse?.headers();
    return { round, ttfbMs: timing && timing.responseStart >= 0 ? timing.responseStart : null, contentMs, appRequests: tracker.requests.length, status: networkResponse?.status() ?? null, cacheStatus: headers?.["cache-status"] ?? null, age: headers?.age ?? null };
  } finally { tracker.stop(); }
}

async function quote(round: number): Promise<PerformanceSample> {
  // Empty cart avoids fabricated variant ids and never reserves stock or places an order.
  const tracker = observe(publicPage);
  try {
    const sample = await publicPage.evaluate(async (round) => {
    const start = performance.now();
    const response = await fetch("/api/cart/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lines: [] }) });
    const ttfbMs = performance.now() - start;
    const payload: unknown = await response.json();
    if (!response.ok || !payload || typeof payload !== "object" || Reflect.get(payload, "ok") !== true) throw new Error("Quote failed");
    return { round, ttfbMs, contentMs: performance.now() - start, appRequests: 1, status: response.status, cacheStatus: response.headers.get("cache-status"), age: response.headers.get("age") };
    }, round);
    await publicPage.waitForTimeout(1000);
    return { ...sample, appRequests: tracker.requests.length };
  } finally { tracker.stop(); }
}

async function run(label: string, path: string, measure: (round: number) => Promise<PerformanceSample>) {
  currentLabel = label;
  const entry: Measurement = { label, path, samples: [] }; measurements.push(entry);
  console.log(`${label}: làm ấm rồi đo 5 lượt…`);
  try {
    await measure(0);
    for (let round = 1; round <= 5; round++) entry.samples.push(await measure(round));
  } catch (error) { entry.failed = true; hasFailures = true; console.error(`${label}: chưa đo đủ (${error instanceof Error ? error.name : "Error"}, bước ${currentStep}); không xuất chi tiết lỗi nhạy cảm.`); }
}

try {
  const response = await publicContext.request.get(origin + "/sitemap.xml");
  if (!response.ok()) throw new Error("Cannot read sitemap");
  const sitemap = await response.text();
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].flatMap((match) => {
    const url = new URL(match[1]); return url.origin === origin ? [url.pathname] : [];
  });
  const category = paths.find((path) => path.startsWith("/collections/") && path !== "/collections/all") ?? "/collections/all";
  const product = paths.find((path) => path.startsWith("/products/"));
  // Git/hosting metadata only; never include account data or management responses in the report.
  const management = existsSync(".env.netlify.local") ? parse(readFileSync(".env.netlify.local")) : null;
  if (management?.NETLIFY_AUTH_TOKEN && management.NETLIFY_SITE_ID) {
    const result = await fetch(`https://api.netlify.com/api/v1/sites/${management.NETLIFY_SITE_ID}`, { headers: { Authorization: `Bearer ${management.NETLIFY_AUTH_TOKEN}` }, signal: AbortSignal.timeout(20000) });
    if (result.ok) { const data: unknown = await result.json(); if (data && typeof data === "object") { const deploy: unknown = Reflect.get(data, "published_deploy"); if (deploy && typeof deploy === "object") { const ref: unknown = Reflect.get(deploy, "commit_ref"); if (typeof ref === "string" && /^[a-f0-9]{40}$/.test(ref)) commit = ref; } } }
  }
  for (const [label, path] of [["Cửa hàng — trang chủ", "/"], ["Cửa hàng — danh mục", category], ["Cửa hàng — danh mục có bộ lọc", `${category}?price=under-200&instock=1`], ["Cửa hàng — tìm kiếm", "/search?q=ao"], ["Cửa hàng — giới thiệu", "/gioi-thieu"]]) await run(label, path, (round) => measurePage(publicPage, path, round));
  if (product) await run("Cửa hàng — sản phẩm", product, (round) => measurePage(publicPage, product, round));
  else measurements.push({ label: "Cửa hàng — sản phẩm", path: "/products/[slug]", samples: [], skipped: "Không có sản phẩm public; không tạo dữ liệu giả" });
  await run("Cửa hàng — quote giỏ rỗng", "/api/cart/quote", quote);
  await run("Admin — đăng nhập → tổng quan", "/admin/login → /admin", login);
  for (const [label, path] of [["Admin — tổng quan", "/admin"], ["Admin — đơn hàng", "/admin/orders"], ["Admin — sản phẩm", "/admin/products"]]) await run(label, path, (round) => measurePage(adminPage, path, round));
  for (const [label, listPath, pattern] of [["Admin — chi tiết đơn", "/admin/orders", /^\/admin\/orders\/[0-9a-f-]+$/], ["Admin — form sản phẩm", "/admin/products", /^\/admin\/products\/[0-9a-f-]+$/]] as const) {
    await adminPage.goto(origin + listPath, { waitUntil: "load", timeout: 60000 }); await heading(adminPage, true);
    const links = await adminPage.locator("main a[href]").evaluateAll((elements) => elements.map((element) => element.getAttribute("href") ?? ""));
    const path = links.find((href) => pattern.test(href));
    if (path) await run(label, listPath + "/[id]", (round) => measurePage(adminPage, path, round));
    else measurements.push({ label, path: listPath + "/[id]", samples: [], skipped: "Chưa có dữ liệu hiện hữu để đo" });
  }
  await run("Admin — Back về danh sách đơn", "/admin/products → Back → /admin/orders", back);
} catch { hasFailures = true; console.error(`Dừng ở ca ${currentLabel}; không xuất response hoặc credential.`); }
finally {
  const at = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }) + " +07:00";
  const metadata = { stage, at, network, origin, commit, credits: cli.values.credits, chromium: browser.version(), measurements };
  const path = "docs/PERFORMANCE-REPORT.md";
  const existing = existsSync(path) ? readFileSync(path, "utf8") : "# PERFORMANCE REPORT — Cham.stu\n\nNgân sách Phase 15: tối đa 4 deploy production; 15.0 không deploy.\n\n";
  writeFileSync(path, existing + "\n" + performanceReport(metadata));
  mkdirSync("test-results", { recursive: true });
  writeFileSync(`test-results/performance-${stage}-${Date.now()}.json`, JSON.stringify(metadata, null, 2));
  await browser.close();
  console.log("Đã ghi docs/PERFORMANCE-REPORT.md (không chứa credential hoặc dữ liệu khách).");
}
if (hasFailures) process.exitCode = 1;
