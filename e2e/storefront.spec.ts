import { expect, test, type Page } from "@playwright/test";

const runtimeErrors = new Map<string, string[]>();

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill("admin@example.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("E2e-private-password-12345");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
}
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    await login(page);
    expect((await page.request.get("/api/phase5-cache-probe?reset=1")).status()).toBe(200);
  } finally { await page.close(); }
});
test.beforeEach(async ({ page, context }, info) => {
  await context.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${info.testId.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0) % 200 + 1}` });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error" && /hydrat|server rendered/i.test(message.text())) errors.push(message.text()); });
  runtimeErrors.set(info.testId, errors);
});
test.afterEach(async ({}, info) => { expect(runtimeErrors.get(info.testId)).toEqual([]); runtimeErrors.delete(info.testId); });

for (const width of [375, 768, 1280]) test(`homepage and responsive overlays at ${width}px`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width, height: 900 });
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cham.stu");
  const sections = page.locator("main > section");
  expect(await sections.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-label")))).toEqual(["Banner cửa hàng", "Danh mục sản phẩm", "BEST SELLER", "NEW ARRIVAL", "Bộ sưu tập thử", "SALE", "Câu chuyện thương hiệu", "Cam kết của cửa hàng"]);
  await expect(page.getByRole("region", { name: "BEST SELLER", exact: true }).getByTestId("product-card")).toHaveCount(8);
  await expect(page.getByRole("region", { name: "SALE", exact: true }).getByTestId("product-card")).toHaveCount(3);
  await expect(page.getByText("HẾT HÀNG").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bộ sưu tập rỗng" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Liên hệ Zalo", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Gọi cho shop", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Liên hệ Messenger", exact: true })).toHaveCount(0);
  await expect(page.getByText("Thông tin liên hệ", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Thông tin pháp lý")).toHaveCount(0);
  await expect(page.getByText("Thanh toán: COD", { exact: true })).toBeVisible();
  await expect(page.locator(".shop-floating")).toBeAttached();
  await page.evaluate(() => window.scrollTo(0, 0));
  await noOverflow(page);
  await page.screenshot({ path: `test-results/storefront-${width}.png`, fullPage: true });
  if (width < 1024) {
    await page.getByRole("button", { name: "Mở menu" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "SHOP", exact: true }).click();
    await dialog.locator("summary").filter({ hasText: /^Áo$/ }).click();
    await expect(dialog.getByRole("link", { name: "Áo thun", exact: true })).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Áo thun", exact: true })).toBeInViewport();
    await noOverflow(page);
    await page.screenshot({ path: `test-results/storefront-menu-${width}.png` });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Mở menu" })).toBeFocused();
    await page.getByRole("button", { name: "Mở menu" }).click();
    await page.locator('[data-slot="sheet-overlay"]').click({ position: { x: width - 8, y: 200 }, force: true });
    await expect(page.getByRole("dialog")).toHaveCount(0);
  } else {
    const shop = page.getByRole("button", { name: "SHOP", exact: true });
    await shop.focus();
    await expect(shop).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#shop-mega-menu").getByRole("link", { name: "Áo thun", exact: true })).toBeVisible();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Escape");
    await expect(shop).toHaveAttribute("aria-expanded", "false");
    await expect(shop).toBeFocused();
    await shop.hover();
    await expect(page.locator("#shop-mega-menu")).toBeVisible();
    await page.screenshot({ path: "test-results/storefront-mega-menu.png" });
    await page.getByRole("heading", { name: "BEST SELLER", exact: true }).hover();
    await expect(page.locator("#shop-mega-menu")).toHaveCount(0);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "Mở tìm kiếm" }).click();
  await expect(page.getByLabel("Tìm kiếm sản phẩm", { exact: true })).toBeFocused();
  await page.getByLabel("Tìm kiếm sản phẩm", { exact: true }).fill("ao kiem thu");
  await expect(page.getByRole("dialog").locator("li")).toHaveCount(6);
  await expect(page.getByRole("dialog").getByText("Áo kiểm thử 9", { exact: true })).toHaveCount(0);
  await noOverflow(page);
  await page.screenshot({ path: `test-results/storefront-search-${width}.png` });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Mở tìm kiếm" })).toBeFocused();
  await page.getByRole("button", { name: "Mở tìm kiếm" }).click();
  await page.locator('[data-slot="sheet-overlay"]').click({ position: { x: width - 8, y: 800 }, force: true });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 800));
  await expect(page.getByRole("button", { name: "Về đầu trang" })).toBeVisible();
  await expect(page.locator("#shop-header")).toHaveAttribute("data-scrolled", "");
  await page.getByRole("button", { name: "Về đầu trang" }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("search debounce, cancellation and public API validation/rate limit", async ({ page, context }) => {
  const requests: string[] = [];
  page.on("request", (request) => { if (request.url().includes("/api/search/suggest")) requests.push(request.url()); });
  await page.goto("/");
  await page.getByRole("button", { name: "Mở tìm kiếm" }).click();
  const input = page.getByLabel("Tìm kiếm sản phẩm", { exact: true });
  await input.fill("a");
  await page.waitForTimeout(300);
  expect(requests).toHaveLength(0);
  await input.fill("ao"); await input.fill("ao kiem"); await input.fill("ao kiem thu");
  await expect(page.getByRole("dialog").locator("li")).toHaveCount(6);
  expect(requests).toHaveLength(1);
  await input.fill("zzzzzz");
  await expect(page.getByRole("status").filter({ hasText: "Không tìm thấy" })).toBeVisible();
  await input.fill("a");
  await expect(page.getByRole("dialog").locator("li")).toHaveCount(0);
  const invalid = await context.request.get("/api/search/suggest?q=a");
  expect(invalid.status()).toBe(400); expect(invalid.headers()["cache-control"]).toBe("no-store");
  const valid = await context.request.get("/api/search/suggest?q=ao%20kiem%20thu");
  expect(valid.status()).toBe(200); expect(valid.headers()["cache-control"]).toBe("public, s-maxage=60");
  const body = await valid.json(); expect(body.ok).toBe(true); expect(body.data).toHaveLength(6);
  expect(body.data[0]).not.toHaveProperty("variants");
  const responses = await Promise.all(Array.from({ length: 61 }, () => context.request.get("/api/search/suggest?q=zz", { headers: { "x-forwarded-for": "203.0.113.250" } })));
  expect(responses.filter((response) => response.status() === 200)).toHaveLength(60);
  const limited = responses.find((response) => response.status() === 429)!;
  expect((await limited.json()).error.code).toBe("RATE_LIMITED");
  expect(limited.headers()["cache-control"]).toBe("no-store");
});

test("sliders rotate normally and stay still with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const first = page.getByRole("button", { name: "Đến banner 1" });
  await expect(first).toHaveAttribute("aria-current", "true");
  await expect(page.getByRole("button", { name: "Đến banner 3" })).toHaveCount(0);
  await expect(page.getByTestId("announcement")).toHaveText("Thông báo kiểm thử hai", { timeout: 6000 });
  await expect(page.getByRole("button", { name: "Đến banner 2" })).toHaveAttribute("aria-current", "true", { timeout: 6000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.getByTestId("announcement")).toHaveText("Thông báo kiểm thử một");
  await page.waitForTimeout(5500);
  await expect(first).toHaveAttribute("aria-current", "true");
  await expect(page.getByTestId("announcement")).toHaveText("Thông báo kiểm thử một");
  await page.getByRole("button", { name: "Đến banner 2" }).click();
  await expect(page.getByRole("button", { name: "Đến banner 2" })).toHaveAttribute("aria-current", "true");
});

test("saved contact settings reach the real homepage immediately", async ({ page }) => {
  await login(page);
  await page.goto("/admin/settings");
  await page.getByLabel("Số điện thoại", { exact: true }).fill("0900000000");
  await page.getByLabel("Số điện thoại Zalo", { exact: true }).fill("0900000000");
  const save = page.getByRole("button", { name: "Lưu thông tin shop", exact: true });
  await save.click();
  await expect(save.locator("xpath=ancestor::form")).toHaveAttribute("data-setting-dirty", "false");
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Liên hệ Zalo", exact: true })).toHaveAttribute("href", "https://zalo.me/0900000000");
  await expect(page.getByRole("link", { name: "Gọi cho shop", exact: true })).toHaveAttribute("href", "tel:0900000000");
  await expect(page.getByText("Thông tin liên hệ", { exact: true })).toBeVisible();
});
