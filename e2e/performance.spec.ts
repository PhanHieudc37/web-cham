import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";
import { isApplicationRequest } from "../src/lib/performance-measurement";

const fixture = (command = "read") => JSON.parse(execFileSync(process.execPath, ["--conditions=react-server", "--import=tsx", "e2e/cart-fixture.ts", command], { encoding: "utf8" })) as { productId: string; blackId: string };
for (const width of [375, 768, 1280]) test(`cached listing filters and local search without server calls at ${width}px`, async ({ page, request }) => {
  await page.setViewportSize({ width, height: 900 });
  const html = await request.get("/collections/all");
  expect(html.status()).toBe(200); expect((await html.text()).match(/data-testid="product-card"/g)?.length).toBe(12);
  await page.goto("/collections/all"); await page.locator('[data-filters-ready="true"]').waitFor();
  await page.waitForLoadState("networkidle");
  const requests: string[] = [];
  page.on("request", (request) => { if (isApplicationRequest(request.url(), new URL(page.url()).origin, request.resourceType())) requests.push(new URL(request.url()).pathname); });
  if (width < 1024) await page.getByRole("button", { name: "BỘ LỌC", exact: true }).click();
  const scope = width < 1024 ? page.getByRole("dialog") : page.getByRole("complementary", { name: "Bộ lọc sản phẩm" });
  const elapsed = await scope.getByRole("button", { name: "M", exact: true }).evaluate((button) => new Promise<number>((resolve) => {
    const start = performance.now();
    const observer = new MutationObserver(() => { if (button.getAttribute("aria-pressed") === "true") { observer.disconnect(); requestAnimationFrame(() => resolve(performance.now() - start)); } });
    observer.observe(button, { attributes: true }); (button as HTMLButtonElement).click();
  }));
  expect(elapsed).toBeLessThan(100); await expect(page).toHaveURL(/size=M/);
  await scope.getByLabel("Dưới 200.000₫", { exact: true }).click();
  await expect(scope.getByLabel("Dưới 200.000₫", { exact: true })).toBeChecked();
  await scope.getByLabel("Chỉ hiện sản phẩm còn hàng").click();
  await expect(scope.getByLabel("Chỉ hiện sản phẩm còn hàng")).toBeChecked();
  await scope.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  if (width < 1024) await page.keyboard.press("Escape");
  await page.getByRole("combobox", { name: "Sắp xếp theo:" }).click(); await page.getByRole("option", { name: "Giá: Tăng dần", exact: true }).click();
  await page.getByRole("button", { name: "Trang 2", exact: true }).click(); await expect(page).toHaveURL(/page=2/);
  await page.waitForTimeout(500); expect(requests).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.screenshot({ path: `test-results/phase15b-listing-${width}.png`, fullPage: true });
  await page.goto("/search?q=ao"); await expect(page.getByRole("status")).toContainText("kết quả"); await page.waitForLoadState("networkidle"); requests.length = 0;
  await page.getByLabel("Từ khóa tìm kiếm").fill("ao thun hai mau"); await page.getByRole("button", { name: "Tìm sản phẩm", exact: true }).click();
  await expect(page.getByTestId("product-card").filter({ hasText: "Áo thun hai màu" })).toBeVisible();
  await page.getByRole("button", { name: "Mở tìm kiếm", exact: true }).click(); await page.getByLabel("Tìm kiếm sản phẩm", { exact: true }).fill("ao thun");
  await expect(page.getByRole("dialog").locator("li").first()).toBeVisible(); await page.getByLabel("Tìm kiếm sản phẩm", { exact: true }).fill("khong-co");
  await expect(page.getByRole("dialog").getByRole("status")).toContainText("Không tìm thấy"); await page.waitForTimeout(500);
  expect(requests).toEqual([]); expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test("fresh availability blocks purchases until checked, updates stock/price, and retries safely", async ({ page }) => {
  const { productId } = fixture("reset");
  let release: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route(`**/api/products/${productId}/availability`, async (route) => { await gate; await route.continue(); }, { times: 1 });
  await page.goto("/products/ao-thun-hai-mau"); await expect(page.getByRole("button", { name: "MUA NGAY", exact: true })).toBeDisabled();
  release?.(); await page.locator('[data-availability-ready="true"]').waitFor(); await page.getByRole("button", { name: "M", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Chỉ còn 2" })).toBeVisible();
  fixture("reduce"); await page.reload(); await page.locator('[data-availability-ready="true"]').waitFor(); await page.getByRole("button", { name: "M", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Chỉ còn 1" })).toBeVisible();
  await page.route(`**/api/products/${productId}/availability`, (route) => route.abort(), { times: 1 }); await page.reload();
  await expect(page.getByRole("button", { name: "MUA NGAY", exact: true })).toBeDisabled(); await page.getByRole("button", { name: "Thử kiểm tra lại", exact: true }).click();
  await page.locator('[data-availability-ready="true"]').waitFor(); await expect(page.getByRole("button", { name: "MUA NGAY", exact: true })).toBeEnabled();
});
