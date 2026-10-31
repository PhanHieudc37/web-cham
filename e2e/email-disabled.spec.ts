import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test.beforeEach(() => {
  execFileSync(process.execPath, ["--conditions=react-server", "--import=tsx", "e2e/checkout-fixture.ts", "reset"], { stdio: "pipe" });
});

for (const width of [375, 768, 1280]) test(`email-disabled checkout and admin remain usable at ${width}px`, async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/products/ao-thun-hai-mau");
  await page.locator('[data-cart-ready="true"]').first().waitFor();
  await page.getByRole("button", { name: "Màu Đen", exact: true }).click();
  await page.getByRole("button", { name: "M", exact: true }).click();
  await page.getByRole("button", { name: "MUA NGAY", exact: true }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await page.locator('[data-checkout-ready="true"]').waitFor();
  await expect(page.getByRole("note")).toContainText("Website hiện chưa gửi email tự động");
  await expect(page.getByLabel("Email nhận xác nhận đơn", { exact: true })).toHaveCount(0);
  await page.getByLabel("Họ và tên *", { exact: true }).fill("Khách kiểm thử");
  await page.getByLabel("Số điện thoại *", { exact: true }).fill("0912345678");
  await page.getByLabel("Email liên hệ (không bắt buộc)", { exact: true }).fill("customer@example.test");
  await page.getByLabel("Tỉnh / Thành phố *", { exact: true }).selectOption({ label: "Hà Nội" });
  await page.getByLabel("Phường / Xã *", { exact: true }).fill("Phường kiểm thử");
  await page.getByLabel("Địa chỉ cụ thể *", { exact: true }).fill("Địa chỉ kiểm thử riêng");
  await page.getByRole("checkbox").check();
  await noOverflow(page);
  await page.getByRole("button", { name: "ĐẶT HÀNG", exact: true }).click();
  await expect(page).toHaveURL(/\/checkout\/success\?/);
  const code = await page.getByTestId("order-code").innerText();
  await expect(page.getByRole("note")).toContainText("Website hiện chưa gửi email tự động");
  await expect(page.getByRole("link", { name: "tra cứu trạng thái đơn hàng", exact: true })).toHaveAttribute("href", "/kiem-tra-don-hang");
  await noOverflow(page);
  await page.screenshot({ path: `test-results/email-disabled-receipt-${width}.png`, fullPage: true });
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill("admin@example.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("E2e-private-password-12345");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("note")).toContainText("Email tự động đang tắt");
  await page.goto(`/admin/orders?q=${code}`);
  await page.getByRole("link", { name: code, exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { name: code, exact: true })).toBeVisible();
  await noOverflow(page);
  await page.screenshot({ path: `test-results/email-disabled-admin-${width}.png`, fullPage: true });
  expect(readFileSync("test-results/phase12-notifications.jsonl", "utf8")).toBe("");
  expect(errors).toEqual([]);
});
