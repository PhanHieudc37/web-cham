import { spawnSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
declare global { interface Window { supportBodies: string[] } }
async function actionBody(page: Page, click: () => Promise<void>) {
  const index = await page.evaluate(() => window.supportBodies.length);
  await click();
  await expect.poll(() => page.evaluate(() => window.supportBodies.length)).toBeGreaterThan(index);
  return page.evaluate((index) => window.supportBodies[index], index);
}

function fixture(command = "read"): { messages: number; handled: number; orders: number } {
  const result = spawnSync(process.execPath, ["--conditions=react-server", "--import=tsx", "e2e/support-fixture.ts", command], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`Fixture lỗi: ${result.stderr}`);
  return JSON.parse(result.stdout.trim());
}
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); }
async function login(page: Page) {
  await page.goto("/admin/login"); await page.getByLabel("Email", { exact: true }).fill("staff@example.test"); await page.getByLabel("Mật khẩu", { exact: true }).fill("E2e-private-password-12345"); await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(page).toHaveURL(/\/admin$/);
}
async function lookup(page: Page, code = "CSLOOK11", phone = "0912345678") {
  await expect(page.locator('form[data-ready="true"]')).toBeVisible();
  await page.getByLabel("Mã đơn hàng", { exact: true }).fill(code); await page.getByLabel("Số điện thoại đặt hàng", { exact: true }).fill(phone);
  const body = await actionBody(page, () => page.getByRole("button", { name: "TRA CỨU ĐƠN HÀNG", exact: true }).click()); await expect(page.getByRole("button", { name: "TRA CỨU ĐƠN HÀNG", exact: true })).toBeEnabled(); return body;
}
async function contact(page: Page) {
  await expect(page.locator('form[data-ready="true"]')).toBeVisible();
  await page.getByLabel("Họ tên *", { exact: true }).fill("Khách liên hệ kiểm thử"); await page.getByLabel("Số điện thoại *", { exact: true }).fill("0912345678"); await page.getByLabel("Email (không bắt buộc)", { exact: true }).fill("contact@example.test"); await page.getByLabel("Nội dung * (10–1000 ký tự)", { exact: true }).fill("Tư vấn cho tôi size áo phù hợp nhé.");
  const body = await actionBody(page, () => page.getByRole("button", { name: "GỬI LỜI NHẮN", exact: true }).click()); await expect(page.getByRole("button", { name: "GỬI LỜI NHẮN", exact: true })).toBeEnabled(); return body;
}
const errors = new Map<string, string[]>();
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try { await login(page); const response = await page.request.get("/api/phase5-cache-probe?reset=1&slug=best-seller"); expect(response.status()).toBe(200); expect((await response.json()).listing.length).toBeGreaterThanOrEqual(4); }
  finally { await page.close(); }
});
test.beforeEach(async ({ page, context }, info) => {
  // Clone the browser response; Chromium's CDP body buffer can evict streamed Next action responses.
  await page.addInitScript(() => {
    const state = window; state.supportBodies = [];
    const fetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const response = await fetch(...args);
      if (args[1]?.method?.toUpperCase() === "POST") void response.clone().text().then((body) => state.supportBodies.push(body));
      return response;
    };
  });
  fixture("reset"); await context.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${info.testId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 200 + 1}` }); await page.emulateMedia({ reducedMotion: "reduce" });
  const list: string[] = []; errors.set(info.testId, list); page.on("pageerror", (error) => list.push(error.message)); page.on("console", (message) => { if (message.type() === "error" && /hydrat|server rendered/i.test(message.text())) list.push(message.text()); });
});
test.afterEach(async ({}, info) => { expect(errors.get(info.testId)).toEqual([]); errors.delete(info.testId); });

for (const width of [375, 768, 1280]) {
  test(`private lookup and tracking copy at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 }); await page.goto("/kiem-tra-don-hang"); await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    const body = await lookup(page, "cslook11", "+84912345678"); const result = page.getByRole("region", { name: "Kết quả tra cứu đơn hàng" }); await expect(result).toContainText("CSLOOK11"); await expect(result).toContainText("0912***678"); await expect(result).toContainText("230.000₫"); await expect(result.getByRole("list", { name: "Tiến trình đơn hàng" })).toContainText("Chưa đến bước này");
    for (const value of ["PRIVATE_ADDRESS", "PRIVATE_WARD", "PRIVATE_INTERNAL_NOTE", "private@example.test"]) expect(body).not.toContain(value);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]); await result.getByRole("button", { name: "Sao chép mã vận đơn", exact: true }).click(); expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("TRACK11"); await noOverflow(page); await page.screenshot({ path: `test-results/phase11-lookup-${width}.png`, fullPage: true, caret: "initial" });
  });
  test(`contact reaches staff inbox and records handling at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await page.goto("/lien-he"); await contact(page); await expect(page.getByRole("status").filter({ hasText: "Cảm ơn bạn đã để lại lời nhắn." })).toBeVisible(); expect(fixture()).toMatchObject({ messages: 1, handled: 0 }); await noOverflow(page); await page.screenshot({ path: `test-results/phase11-contact-${width}.png`, fullPage: true, caret: "initial" });
    await login(page); await page.goto("/admin/messages"); await expect(page.getByRole("heading", { name: "Khách liên hệ kiểm thử" })).toBeVisible(); await expect(page.getByText("Tư vấn cho tôi size áo phù hợp nhé.", { exact: true })).toBeVisible(); await noOverflow(page); await page.screenshot({ path: `test-results/phase11-messages-${width}.png`, fullPage: true, caret: "initial" });
    await page.getByRole("button", { name: "Đánh dấu đã xử lý", exact: true }).click(); await expect(page.getByText("Không có tin nhắn mới.", { exact: true })).toBeVisible(); await page.getByRole("link", { name: /^Đã xử lý/ }).click(); await expect(page.getByText(/Đã xử lý:.*Nhân viên kiểm thử/)).toBeVisible(); expect(fixture()).toMatchObject({ messages: 1, handled: 1 });
  });
  test(`information pages, size charts and 404 recommendations at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/gioi-thieu", "/chinh-sach-doi-tra", "/chinh-sach-bao-mat", "/dieu-khoan-dich-vu", "/huong-dan-chon-size"]) {
      expect((await page.goto(path))?.status()).toBe(200); await expect(page.getByRole("heading", { level: 1 })).toBeVisible(); await noOverflow(page);
      if (path === "/huong-dan-chon-size") { await expect(page.getByRole("table")).not.toHaveCount(0); await page.screenshot({ path: `test-results/phase11-size-${width}.png`, fullPage: true, caret: "initial" }); }
      if (path === "/chinh-sach-bao-mat") { await expect(page.locator("article")).toContainText("IP"); await expect(page.locator("article")).toContainText("Supabase"); await expect(page.locator("article")).toContainText("xóa"); await page.screenshot({ path: `test-results/phase11-privacy-${width}.png`, fullPage: true, caret: "initial" }); }
    }
    expect((await page.goto("/trang-khong-ton-tai-phase11"))?.status()).toBe(404); await expect(page.getByRole("heading", { name: "KHÔNG TÌM THẤY TRANG" })).toBeVisible(); await expect(page.getByTestId("product-card")).toHaveCount(4); await noOverflow(page); await page.screenshot({ path: `test-results/phase11-404-${width}.png`, fullPage: true, caret: "initial" });
  });
}
test("wrong credentials share one error; attempt eleven is RATE_LIMITED; terminal reasons are shown", async ({ page }) => {
  await page.goto("/kiem-tra-don-hang"); const generic = "Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn và số điện thoại.";
  for (const [code, phone] of [["CSWRONG", "0912345678"], ["CSLOOK11", "0987654321"]]) { await lookup(page, code, phone); await expect(page.locator('p[role="alert"]')).toHaveText(generic); await expect(page.getByRole("region", { name: "Kết quả tra cứu đơn hàng" })).toHaveCount(0); }
  await lookup(page, "CSCANCEL11"); await expect(page.getByRole("region", { name: "Kết quả tra cứu đơn hàng" })).toContainText("Khách yêu cầu hủy"); await lookup(page, "CSRETURN11"); await expect(page.getByRole("region", { name: "Kết quả tra cứu đơn hàng" })).toContainText("Khách gửi lại hàng");
  for (let index = 4; index < 10; index++) await lookup(page);
  expect(await lookup(page)).toContain("RATE_LIMITED"); await expect(page.locator('p[role="alert"]')).toHaveText("Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.");
});
test("contact validates content, ignores honeypots and rejects the fourth request", async ({ page }) => {
  await page.goto("/lien-he"); await page.getByLabel("Họ tên *", { exact: true }).fill("A"); await page.getByRole("button", { name: "GỬI LỜI NHẮN", exact: true }).click(); await expect(page.locator("#contact-name-error")).toBeVisible(); expect(fixture().messages).toBe(0);
  await page.locator("#contact-website").fill("bot", { force: true }); await contact(page); expect(fixture().messages).toBe(0);
  await contact(page); await contact(page); expect(fixture().messages).toBe(2); expect(await contact(page)).toContain("RATE_LIMITED"); expect(fixture().messages).toBe(2);
});
test("inbox requires login, paginates twenty messages and preserves tab on reload", async ({ page }) => {
  await page.goto("/admin/messages"); await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fmessages/); fixture("populate"); await login(page); await page.goto("/admin/messages"); await expect(page.locator("#admin-content article")).toHaveCount(20); await page.getByRole("link", { name: "Sau", exact: true }).click(); await expect(page).toHaveURL(/page=2/); await expect(page.locator("#admin-content article")).toHaveCount(1); await page.getByRole("link", { name: /^Đã xử lý/ }).click(); await expect(page).toHaveURL(/status=handled/); await page.reload(); await expect(page).toHaveURL(/status=handled/); await expect(page.locator("#admin-content article")).toHaveCount(2);
});
