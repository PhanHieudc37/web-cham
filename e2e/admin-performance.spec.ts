import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";

type Fixture = { orderId: string; code: string; status: string; paymentStatus: string; messageId: string; messageStatus: string; categoryId: string; categoryName: string; categoryActive: boolean; productId: string };
const fixture = (command = "read") => JSON.parse(execFileSync(process.execPath, ["--conditions=react-server", "--import=tsx", "e2e/admin-performance-fixture.ts", command], { encoding: "utf8" })) as Fixture;
async function login(page: Page) {
  await page.goto("/admin/login?next=/admin/orders");
  await page.getByLabel("Email", { exact: true }).fill("admin@example.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("E2e-private-password-12345");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL("http://localhost:3100/admin/orders");
  await page.locator("main h1").filter({ hasText: /^Đơn hàng$/ }).waitFor();
}
async function blockAction(page: Page, path: string, fail = false) {
  let release: () => void = () => { throw new Error("Gate not ready"); };
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let blocked = false;
  await page.route(`**${path}`, async (route) => {
    if (!blocked && route.request().method() === "POST" && route.request().headers()["next-action"]) {
      blocked = true; await gate;
      if (fail) await route.abort(); else await route.continue();
    } else await route.continue();
  });
  return release;
}
test.beforeEach(async ({ context }, info) => {
  fixture("reset");
  await context.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${info.testId.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0) % 200 + 1}` });
});

for (const width of [375, 768, 1280]) test(`static login, intent prefetch, optimistic status and fresh Back at ${width}px`, async ({ page, request }) => {
  const data = fixture(); await page.setViewportSize({ width, height: 900 }); await page.mouse.move(width - 1, 899);
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  await request.get("/admin/login");
  const cached = await request.get("/admin/login"); expect(cached.status()).toBe(200); expect(cached.headers()["x-nextjs-cache"]).toBe("HIT"); expect(cached.headers()["cache-control"]).not.toContain("no-store"); expect(cached.headers()["x-robots-tag"]).toContain("noindex"); expect(await cached.text()).not.toContain("Khách kiểm thử admin");
  const prefetches: string[] = []; page.on("request", (request) => { if (request.headers()["next-router-prefetch"]) prefetches.push(request.url()); });
  await login(page); await page.waitForLoadState("networkidle"); await page.waitForTimeout(500); expect(prefetches).toEqual([]);
  if (width === 1280) {
    const prefetched = page.waitForRequest((request) => Boolean(request.headers()["next-router-prefetch"]) && new URL(request.url()).pathname === "/admin/products");
    await page.locator('aside a[href="/admin/products"]').hover(); await prefetched;
  }
  await page.getByRole("link", { name: data.code, exact: true }).filter({ visible: true }).click();
  await page.getByRole("button", { name: "Xác nhận đơn", exact: true }).click();
  const release = await blockAction(page, `/admin/orders/${data.orderId}`);
  await page.getByRole("dialog").getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByTestId("order-status-summary")).toContainText("Đã xác nhận");
  expect(fixture().status).toBe("pending"); release();
  await expect(page.getByRole("dialog")).toBeHidden(); expect(fixture().status).toBe("confirmed");
  await page.goBack(); await expect(page).toHaveURL(/\/admin\/orders$/);
  const row = page.locator(width < 1280 ? "article" : "tr").filter({ has: page.getByRole("link", { name: data.code, exact: true }) }).filter({ visible: true });
  await expect(row).toContainText("Đã xác nhận");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.screenshot({ path: `test-results/phase15c-orders-${width}.png`, fullPage: true });
  await page.goto("/admin/login?next=/admin/products"); await expect(page).toHaveURL(/\/admin\/products$/);
  expect(errors).toEqual([]);
});

test("optimistic status, payment, visibility and message handling roll back on failure", async ({ page }) => {
  const data = fixture(); await login(page); await page.goto(`/admin/orders/${data.orderId}`);
  let release = await blockAction(page, `/admin/orders/${data.orderId}`, true);
  await page.getByRole("button", { name: "Xác nhận đơn", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByTestId("order-status-summary")).toContainText("Đã xác nhận"); release();
  await expect(page.getByTestId("order-status-summary")).toContainText("Chờ xác nhận"); await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Quay lại", exact: true }).click();
  await page.unrouteAll(); release = await blockAction(page, `/admin/orders/${data.orderId}`, true);
  await page.getByRole("button", { name: "Đã nhận tiền", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByTestId("order-status-summary")).toContainText("Đã thanh toán"); release();
  await expect(page.getByTestId("order-status-summary")).toContainText("Chưa thanh toán");
  await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible(); expect(fixture().paymentStatus).toBe("unpaid");
  await page.getByRole("dialog").getByRole("button", { name: "Quay lại", exact: true }).click();
  await page.unrouteAll(); await page.goto("/admin/categories"); release = await blockAction(page, "/admin/categories", true);
  const visibility = page.getByRole("checkbox", { name: `Hiển thị ${data.categoryName}`, exact: true });
  await visibility.click(); await expect(visibility).not.toBeChecked(); release();
  await expect(visibility).toBeChecked(); expect(fixture().categoryActive).toBe(true);
  await page.unrouteAll(); await page.goto("/admin/messages"); release = await blockAction(page, "/admin/messages", true);
  const message = page.getByRole("heading", { name: "Lời nhắn kiểm thử admin", exact: true });
  await page.getByRole("button", { name: "Đánh dấu đã xử lý", exact: true }).click(); await expect(message).toHaveCount(0); release();
  await expect(message).toBeVisible(); expect(fixture().messageStatus).toBe("new");
  await page.unrouteAll(); await page.getByRole("button", { name: "Đánh dấu đã xử lý", exact: true }).click();
  await expect(message).toHaveCount(0); await expect.poll(() => fixture().messageStatus).toBe("handled");
});
