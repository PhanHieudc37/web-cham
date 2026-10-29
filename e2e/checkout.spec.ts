import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";

function fixture(command = "read"): { count: number; total: number; quantity: number; stock: number; movements: number; variantId: string } {
  return JSON.parse(execFileSync(process.execPath, ["--conditions=react-server", "--import=tsx", "e2e/checkout-fixture.ts", command], { encoding: "utf8" }));
}
async function login(page: Page) {
  await page.goto("/admin/login"); await page.getByLabel("Email", { exact: true }).fill("admin@example.test"); await page.getByLabel("Mật khẩu", { exact: true }).fill("E2e-private-password-12345");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(page).toHaveURL(/\/admin$/);
}
async function checkout(page: Page) {
  await page.goto("/products/ao-thun-hai-mau"); await page.locator('[data-cart-ready="true"]').waitFor();
  await page.getByRole("button", { name: "M", exact: true }).click(); await page.getByRole("button", { name: "MUA NGAY", exact: true }).click();
  await expect(page).toHaveURL(/\/checkout$/); await page.locator('[data-checkout-ready="true"]').waitFor();
}
async function fill(page: Page) {
  await page.getByLabel("Họ và tên *", { exact: true }).fill("Khách kiểm thử");
  await page.getByLabel("Số điện thoại *", { exact: true }).fill("+84 912.345.678");
  await page.getByLabel("Email nhận xác nhận đơn", { exact: true }).fill("customer@example.test");
  await page.getByLabel("Tỉnh / Thành phố *", { exact: true }).selectOption("Hà Nội");
  await page.getByLabel("Phường / Xã *", { exact: true }).fill("Phường kiểm thử");
  await page.getByLabel("Địa chỉ cụ thể *", { exact: true }).fill("Địa chỉ dùng riêng cho kiểm thử");
  await page.getByRole("checkbox").check();
}
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth)); }
const errors = new Map<string, string[]>();
test.beforeAll(async ({ browser }) => { fixture("reset"); const page = await browser.newPage(); try { await login(page); expect((await page.request.get("/api/phase5-cache-probe?reset=1")).status()).toBe(200); } finally { await page.close(); } });
test.beforeEach(async ({ page, context }, info) => {
  fixture("reset"); await context.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${info.testId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 200 + 1}` });
  await context.route("https://img.vietqr.io/**", (route) => route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="white"/><text x="20" y="250">QR test fixture</text></svg>' }));
  const list: string[] = []; errors.set(info.testId, list); page.on("pageerror", (error) => list.push(error.message)); page.on("console", (message) => { if (message.type() === "error" && /hydrat|server rendered/i.test(message.text())) list.push(message.text()); });
});
test.afterEach(async ({}, info) => { expect(errors.get(info.testId)).toEqual([]); errors.delete(info.testId); });

for (const width of [375, 768, 1280]) test(`COD checkout, notes, private receipt and responsive form at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await page.emulateMedia({ reducedMotion: "reduce" });
  await checkout(page); await fill(page); await page.getByLabel("Ghi chú đơn hàng", { exact: true }).fill("Ghi chú kiểm thử");
  await expect(page.getByRole("button", { name: "Mở menu", exact: true })).toHaveCount(0); await expect(page.locator(".shop-floating")).toHaveCount(0);
  expect(await page.getByLabel("Tỉnh / Thành phố *", { exact: true }).locator("option").count()).toBe(35);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const originalKey = await page.evaluate(() => sessionStorage.getItem("cham-checkout-key-v1")); expect(originalKey).toBeTruthy();
  await noOverflow(page); await page.screenshot({ path: `test-results/phase9-checkout-${width}.png`, fullPage: true, caret: "initial" });
  await page.getByRole("button", { name: "ĐẶT HÀNG", exact: true }).click(); await expect(page).toHaveURL(/\/checkout\/success\?code=.*&t=/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("CẢM ƠN BẠN ĐÃ ĐẶT HÀNG!"); await expect(page.getByTestId("receipt-total")).toHaveText("229.000₫");
  await expect(page.getByText("Thanh toán khi nhận hàng (COD)", { exact: true })).toBeVisible(); await expect(page.getByRole("img", { name: /^Mã VietQR/ })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Chi tiết đơn hàng", exact: true })).toContainText("0912345678");
  expect(fixture()).toMatchObject({ count: 1, total: 229000, quantity: 1, stock: 1, movements: 1 });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("cham-cart-v1")!).state.lines)).toEqual([]); expect(await page.evaluate(() => sessionStorage.getItem("cham-checkout-key-v1"))).toBeNull();
  await noOverflow(page); await page.screenshot({ path: `test-results/phase9-receipt-${width}.png`, fullPage: true, caret: "initial" });
  const receipt = page.url(); await page.reload(); await expect(page.getByTestId("receipt-total")).toHaveText("229.000₫"); expect(fixture().count).toBe(1);
  const invalid = new URL(receipt); invalid.searchParams.set("t", "A".repeat(43)); expect((await page.goto(invalid.toString()))?.status()).toBe(404); await expect(page.getByText("0912345678", { exact: false })).toHaveCount(0);
});

test("bank transfer shows an exact server-priced VietQR payload and copy buttons", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]); await page.setViewportSize({ width: 375, height: 900 });
  await checkout(page); await fill(page); await page.getByLabel("Chuyển khoản ngân hàng", { exact: true }).check();
  await page.getByRole("button", { name: "ĐẶT HÀNG", exact: true }).click(); await expect(page).toHaveURL(/\/checkout\/success/);
  const code = await page.getByTestId("order-code").innerText(); const qr = page.getByRole("img", { name: `Mã VietQR thanh toán đơn ${code}`, exact: true }); await expect(qr).toBeVisible();
  const url = new URL((await qr.getAttribute("src"))!); expect(url.hostname).toBe("img.vietqr.io"); expect(url.pathname).toBe("/image/970436-123456789-compact2.png"); expect(url.searchParams.get("amount")).toBe("229000"); expect(url.searchParams.get("addInfo")).toBe(code); expect(url.searchParams.get("accountName")).toBe("TAI KHOAN KIEM THU");
  await page.getByRole("button", { name: "Sao chép nội dung chuyển khoản", exact: true }).click(); expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(code);
  await noOverflow(page); await page.screenshot({ path: "test-results/phase9-vietqr-375.png", fullPage: true, caret: "initial" }); expect(fixture()).toMatchObject({ count: 1, stock: 1, total: 229000 });
});

test("schema errors stay beside fields and reload keeps the idempotency key and cart note", async ({ page }) => {
  const { variantId } = fixture(); await page.goto("/cart"); await page.locator('[data-cart-ready="true"]').waitFor();
  await page.evaluate((variantId) => localStorage.setItem("cham-cart-v1", JSON.stringify({ version: 1, state: { lines: [{ variantId, quantity: 1 }], note: "Ghi chú từ giỏ", discountCode: "" } })), variantId);
  await page.reload(); await page.getByRole("button", { name: "THANH TOÁN", exact: true }).click(); await page.locator('[data-checkout-ready="true"]').waitFor();
  await expect(page.getByLabel("Ghi chú đơn hàng", { exact: true })).toHaveValue("Ghi chú từ giỏ");
  const key = await page.evaluate(() => sessionStorage.getItem("cham-checkout-key-v1")); await page.reload(); await page.locator('[data-checkout-ready="true"]').waitFor(); expect(await page.evaluate(() => sessionStorage.getItem("cham-checkout-key-v1"))).toBe(key);
  await page.getByRole("button", { name: "ĐẶT HÀNG", exact: true }).click(); await expect(page.getByLabel("Họ và tên *", { exact: true })).toHaveAttribute("aria-invalid", "true"); await expect(page.getByLabel("Tỉnh / Thành phố *", { exact: true })).toHaveAttribute("aria-invalid", "true"); expect(fixture().count).toBe(0);
  await fill(page); await page.getByLabel("Số điện thoại *", { exact: true }).fill("123"); await page.getByRole("button", { name: "ĐẶT HÀNG", exact: true }).click(); await expect(page.getByText("Số điện thoại không hợp lệ", { exact: true })).toBeVisible(); expect(fixture().stock).toBe(2);
});

test("price changes require explicit agreement and client-tampered totals cannot change the order", async ({ page }) => {
  await checkout(page); await fill(page); fixture("price");
  await page.getByRole("button", { name: "ĐẶT HÀNG", exact: true }).click(); const dialog = page.getByRole("dialog"); await expect(dialog.getByRole("heading", { name: "Giá sản phẩm vừa thay đổi", exact: true })).toBeVisible();
  await expect(dialog).toContainText("229.000₫"); await expect(dialog).toContainText("279.000₫"); expect(fixture().count).toBe(0); await expect(dialog.getByRole("button", { name: "Đồng ý và đặt hàng", exact: true })).toBeEnabled();
  await dialog.getByRole("button", { name: "Đồng ý và đặt hàng", exact: true }).click(); await expect(page).toHaveURL(/\/checkout\/success/); await expect(page.getByTestId("receipt-total")).toHaveText("279.000₫"); expect(fixture()).toMatchObject({ count: 1, total: 279000, stock: 1 });
});

test("unavailable stock is listed and refreshed without creating an order", async ({ page }) => {
  await checkout(page); await fill(page); fixture("empty"); await page.getByRole("button", { name: "ĐẶT HÀNG", exact: true }).click();
  await expect(page.locator("main").getByRole("alert").filter({ hasText: "chỉ còn 0 sản phẩm" })).toBeVisible(); await expect(page.getByRole("button", { name: "ĐẶT HÀNG", exact: true })).toBeDisabled(); await expect(page.getByRole("button", { name: "Cập nhật giỏ hàng", exact: true })).toBeVisible(); expect(fixture()).toMatchObject({ count: 0, stock: 0, movements: 0 });
});

test("concurrent HTTP retries of one action create one order and a forged total requires re-consent", async ({ page }) => {
  await checkout(page); await fill(page);
  let tampered = false;
  await page.route("**/checkout", async (route) => {
    if (route.request().method() !== "POST" || !route.request().headers()["next-action"]) return route.continue();
    const payload: unknown = route.request().postDataJSON();
    if (!Array.isArray(payload) || typeof payload[0] !== "object" || payload[0] === null) throw new Error("Định dạng action thay đổi; cần kiểm tra lại test");
    if (!tampered) { tampered = true; await route.continue({ postData: JSON.stringify([{ ...payload[0], expectedTotal: 1, unitPrice: 1 }]) }); return; }
    // A replay is a separate HTTP request; do not duplicate Next dev-tool stream IDs.
    const replayHeaders = { ...route.request().headers() };
    for (const name of Object.keys(replayHeaders)) if (name.startsWith("x-nextjs-")) delete replayHeaders[name];
    const [first, second] = await Promise.all([route.fetch(), route.fetch({ headers: replayHeaders })]); expect(first.status()).toBe(200); expect(second.status()).toBe(200); await route.fulfill({ response: first });
  });
  await page.getByRole("button", { name: "ĐẶT HÀNG", exact: true }).click(); await expect(page.getByRole("dialog")).toContainText("229.000₫"); expect(fixture().count).toBe(0);
  await expect(page.getByRole("button", { name: "Đồng ý và đặt hàng", exact: true })).toBeEnabled(); await page.getByRole("button", { name: "Đồng ý và đặt hàng", exact: true }).dblclick();
  await expect(page).toHaveURL(/\/checkout\/success/); await expect(page.getByTestId("receipt-total")).toHaveText("229.000₫"); expect(fixture()).toMatchObject({ count: 1, quantity: 1, stock: 1, movements: 1 });
});

test("empty checkout redirects to the cart and malformed success links return HTTP 404", async ({ page }) => {
  await page.goto("/checkout"); await expect(page).toHaveURL(/\/cart$/);
  for (const url of ["/checkout/success", "/checkout/success?code=CS2610280000&t=bad", `/checkout/success?code=CS2610280000&t=${"A".repeat(43)}`]) expect((await page.goto(url))?.status()).toBe(404);
});
