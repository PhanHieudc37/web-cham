import { spawnSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
function fixture(command = "read"): { bankId: string; codId: string; stock: number; cancellations: number; returns: number; notes: number } {
  const result = spawnSync(process.execPath, ["--conditions=react-server", "--import=tsx", "e2e/order-admin-fixture.ts", command], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`Fixture lỗi: ${result.stderr}`);
  return JSON.parse(result.stdout.trim());
}
async function login(page: Page, role = "admin") {
  await page.goto("/admin/login"); await page.getByLabel("Email", { exact: true }).fill(`${role}@example.test`); await page.getByLabel("Mật khẩu", { exact: true }).fill("E2e-private-password-12345"); await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(page).toHaveURL(/\/admin$/);
}
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); }
async function transition(page: Page, label: string) { await page.getByRole("button", { name: label, exact: true }).click(); await page.getByRole("dialog").getByRole("button", { name: "Xác nhận", exact: true }).click(); await expect(page.getByRole("dialog")).toBeHidden(); }
const browserErrors = new Map<string, string[]>();
test.beforeEach(async ({ page, context }, info) => {
  fixture("reset"); await context.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${info.testId.split("").reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % 200 + 1}` });
  await page.addInitScript(() => { window.print = () => { document.documentElement.dataset.printCalled = "true"; }; });
  const errors: string[] = []; browserErrors.set(info.testId, errors); page.on("pageerror", (error) => errors.push(error.message)); page.on("console", (message) => { if (message.type() === "error" && /hydrat|server rendered/i.test(message.text())) errors.push(message.text()); });
});
test.afterEach(async ({}, info) => { expect(browserErrors.get(info.testId)).toEqual([]); browserErrors.delete(info.testId); });

for (const width of [375, 768, 1280]) test(`dashboard, order details, cancellation reason and stock restoration at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await page.emulateMedia({ reducedMotion: "reduce" }); await login(page);
  await expect(page.getByRole("heading", { name: "Doanh thu 14 ngày" })).toBeVisible(); await expect(page.getByRole("heading", { name: "10 đơn mới nhất" })).toBeVisible(); await noOverflow(page); await page.screenshot({ path: `test-results/phase10-dashboard-${width}.png`, fullPage: true, caret: "initial" });
  await page.goto("/admin/orders"); await expect(page.getByText("27 đơn · Trang 1 / 2", { exact: true })).toBeVisible(); await noOverflow(page); await page.screenshot({ path: `test-results/phase10-orders-${width}.png`, fullPage: true, caret: "initial" });
  await page.goto(`/admin/orders/${fixture().bankId}`); await expect(page.getByRole("heading", { level: 1 })).toHaveText("CSBANK10"); await expect(page.getByRole("button", { name: "Hoàn thành", exact: true })).toHaveCount(0); await expect(page.getByText("Nhân viên kiểm thử", { exact: false }).last()).toBeVisible(); await noOverflow(page); await page.screenshot({ path: `test-results/phase10-detail-${width}.png`, fullPage: true, caret: "initial" });
  await page.locator("#tracking").fill("UNSAVED"); await expect(page.getByRole("button", { name: "Lưu vận chuyển" })).toBeVisible(); await noOverflow(page);
  page.once("dialog", (dialog) => dialog.dismiss()); await page.getByRole("link", { name: "← Danh sách đơn hàng", exact: true }).click(); await expect(page).toHaveURL(new RegExp(`/admin/orders/${fixture().bankId}$`));
  await page.locator("#tracking").fill("");
  await page.getByRole("button", { name: "Hủy đơn", exact: true }).click(); await page.getByRole("dialog").getByRole("button", { name: "Xác nhận", exact: true }).click(); await expect(page.getByText("Vui lòng nhập lý do hủy đơn", { exact: true })).toBeVisible();
  await page.getByLabel("Lý do hủy *", { exact: true }).fill("Khách yêu cầu hủy"); await page.getByRole("dialog").getByRole("button", { name: "Xác nhận", exact: true }).click(); await expect(page.getByRole("dialog")).toBeHidden(); await expect(page.getByRole("button", { name: "Xác nhận đơn", exact: true })).toHaveCount(0); await expect(page.getByText("Lý do hủy: Khách yêu cầu hủy")).toBeVisible(); expect(fixture()).toMatchObject({ stock: 7, cancellations: 1 }); await page.reload(); expect(fixture().stock).toBe(7);
});
test("bank confirmation warning, payment/refund, shipping metadata, notes and history", async ({ page, context }) => {
  await login(page, "staff"); await page.goto(`/admin/orders/${fixture().bankId}`);
  await page.getByRole("button", { name: "Xác nhận đơn", exact: true }).click(); await expect(page.getByText("Đơn chưa được thanh toán", { exact: true })).toBeVisible(); await page.getByRole("dialog").getByRole("button", { name: "Xác nhận", exact: true }).click(); await expect(page.getByRole("dialog")).toBeHidden();
  await transition(page, "Đã nhận tiền"); await expect(page.getByRole("button", { name: "Đã nhận tiền", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Chuyển sang Đang giao", exact: true }).click(); await page.getByRole("dialog").getByLabel("Hãng vận chuyển (chọn hoặc nhập Khác)").fill("GHN"); await page.getByRole("dialog").getByLabel("Mã vận đơn", { exact: true }).fill("TRACK-10"); await page.getByRole("dialog").getByRole("button", { name: "Xác nhận", exact: true }).click(); await expect(page.getByRole("dialog")).toBeHidden(); await expect(page.locator("#tracking")).toHaveValue("TRACK-10"); await expect(page.getByText("GHN · TRACK-10", { exact: true })).toBeVisible();
  await page.locator("#carrier").fill("Viettel Post"); await page.locator("#tracking").fill("TRACK-EDIT"); await page.getByRole("button", { name: "Lưu vận chuyển", exact: true }).click(); await expect(page.getByText("Viettel Post · TRACK-EDIT", { exact: true })).toBeVisible();
  await page.getByLabel("Ghi chú nội bộ", { exact: true }).fill("Đã gọi xác nhận với khách"); await page.getByRole("button", { name: "Thêm ghi chú", exact: true }).click(); await expect(page.getByText("Đã gọi xác nhận với khách", { exact: true })).toBeVisible(); expect(fixture().notes).toBe(2);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]); await page.getByRole("button", { name: "Sao chép địa chỉ" }).click(); expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("Địa chỉ kiểm thử");
  await transition(page, "Hoàn trả"); await transition(page, "Đã hoàn tiền"); await expect(page.getByRole("button", { name: "Đã hoàn tiền", exact: true })).toHaveCount(0); expect(fixture()).toMatchObject({ stock: 7, returns: 1 });
});
test("COD completion records payment; A5 print hides admin shell and labels payment honestly", async ({ page }) => {
  await login(page); const id = fixture().codId; await page.goto(`/admin/orders/${id}/print`); await expect(page.locator("html")).toHaveAttribute("data-print-called", "true"); await expect(page.locator("#delivery-note")).toContainText("Thu hộ (COD): 428.000₫");
  await page.emulateMedia({ media: "print" }); await page.setViewportSize({ width: 559, height: 794 }); await expect(page.locator("aside")).toBeHidden(); await expect(page.getByRole("button", { name: "In lại phiếu" })).toBeHidden(); await noOverflow(page); await page.screenshot({ path: "test-results/phase10-print.png", fullPage: true, caret: "initial" }); await page.emulateMedia({ media: "screen" }); await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`/admin/orders/${fixture().bankId}/print`); await expect(page.locator("#delivery-note")).toContainText("Chuyển khoản chưa xác nhận – Không thu hộ"); await expect(page.locator("#delivery-note")).not.toContainText("Đã thanh toán – Không thu tiền");
  await page.goto(`/admin/orders/${id}`); for (const label of ["Xác nhận đơn", "Chuyển sang Đang giao", "Hoàn thành"]) await transition(page, label); await expect(page.getByText("Đã nhận tiền COD khi hoàn thành đơn", { exact: true })).toBeVisible(); await page.goto(`/admin/orders/${id}/print`); await expect(page.locator("#delivery-note")).toContainText("Đã thanh toán – Không thu tiền");
});
test("URL search/filter/pagination and admin CSV export preserve current filters", async ({ page }) => {
  await login(page); await page.goto("/admin/orders"); await page.getByRole("link", { name: "Sau", exact: true }).click(); await expect(page).toHaveURL(/page=2/); await expect(page.getByText("27 đơn · Trang 2 / 2", { exact: true })).toBeVisible();
  await page.getByLabel("Tìm đơn hàng", { exact: true }).fill("0912345678"); await page.getByRole("button", { name: "Áp dụng" }).click(); await expect(page).toHaveURL(/q=0912345678/); await expect(page.getByText("1 đơn · Trang 1 / 1", { exact: true })).toBeVisible();
  const href = await page.getByRole("link", { name: "Xuất CSV", exact: true }).getAttribute("href"); expect(href).toContain("q=0912345678"); const response = await page.request.get(href!); expect(response.status()).toBe(200); expect([...(await response.body()).subarray(0, 3)]).toEqual([239, 187, 191]); const text = (await response.body()).toString("utf8"); expect(text).toContain("CSBANK10"); expect(text).not.toContain("CSCOD10");
  await page.goto("/admin/orders?from=2026-02-30"); await expect(page.getByRole("heading", { name: "Bộ lọc chưa hợp lệ" })).toBeVisible();
});
test("staff and anonymous cannot export; revenue is absent for staff; invalid IDs return 404", async ({ page, request }) => {
  expect((await request.get("/api/admin/orders/export")).status()).toBe(401); await login(page, "staff"); await expect(page.getByRole("heading", { name: "Doanh thu 14 ngày" })).toHaveCount(0); await expect(page.getByText("Doanh thu hôm nay", { exact: true })).toHaveCount(0);
  await page.goto("/admin/orders"); await expect(page.getByRole("link", { name: "Xuất CSV" })).toHaveCount(0); expect((await page.request.get("/api/admin/orders/export")).status()).toBe(403); expect((await page.goto("/admin/orders/not-a-uuid"))?.status()).toBe(404);
});
