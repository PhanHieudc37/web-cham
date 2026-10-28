import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

function fixture(command = "read"): { productId: string; blackId: string; whiteId: string } {
  return JSON.parse(execFileSync(process.execPath, ["--conditions=react-server", "--import=tsx", "e2e/cart-fixture.ts", command], { encoding: "utf8" }));
}
async function login(page: Page) {
  await page.goto("/admin/login"); await page.getByLabel("Email", { exact: true }).fill("admin@example.test"); await page.getByLabel("Mật khẩu", { exact: true }).fill("E2e-private-password-12345");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(page).toHaveURL(/\/admin$/);
}
async function ready(page: Page) { await expect(page.getByRole("button", { name: "Mở giỏ hàng", exact: true })).toBeEnabled(); }
async function settled(page: Page) { await expect(page.getByText("Đang cập nhật giá và tồn kho…", { exact: true })).toHaveCount(0); }
async function add(page: Page, size = "M") {
  await page.getByRole("button", { name: size, exact: true }).click();
  await page.locator("main").getByRole("button", { name: "THÊM VÀO GIỎ", exact: true }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible(); await expect(page.getByRole("dialog").getByTestId("cart-line")).toHaveCount(1); await settled(page);
}
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth)); }
const errors = new Map<string, string[]>();
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try { await login(page); expect((await page.request.get("/api/phase5-cache-probe?reset=1")).status()).toBe(200); } finally { await page.close(); }
});
test.beforeEach(async ({ page, context }, info) => {
  fixture("reset");
  await context.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${info.testId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 200 + 1}` });
  const messages: string[] = []; errors.set(info.testId, messages);
  page.on("pageerror", (error) => messages.push(error.message));
  page.on("console", (message) => { if (message.type() === "error" && /hydrat|server rendered/i.test(message.text())) messages.push(message.text()); });
});
test.afterEach(async ({}, info) => { expect(errors.get(info.testId)).toEqual([]); errors.delete(info.testId); });

for (const width of [375, 768, 1280]) test(`cart drawer and page persist without hydration errors at ${width}px`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" }); await page.setViewportSize({ width, height: 900 });
  await page.goto("/products/ao-thun-hai-mau"); await ready(page);
  await page.locator("main").getByRole("button", { name: "THÊM VÀO GIỎ", exact: true }).first().click();
  await expect(page.locator("main").getByRole("alert")).toHaveText("Vui lòng chọn màu sắc và kích thước");
  await add(page);
  const drawer = page.getByRole("dialog");
  await expect(drawer.getByRole("heading", { name: "GIỎ HÀNG (1)", exact: true })).toBeVisible();
  await expect(drawer.getByTestId("cart-unit-price")).toHaveText("199.000₫");
  await expect(drawer.getByTestId("drawer-total")).toHaveText("229.000₫");
  await expect(drawer.getByTestId("free-ship-progress")).toContainText("Mua thêm 2 sản phẩm");
  await noOverflow(page); await page.screenshot({ path: `test-results/phase8-drawer-${width}.png`, caret: "initial" });
  const box = (await drawer.boundingBox())!; expect(Math.round(box.width)).toBe(width < 640 ? width : 420);
  await page.keyboard.press("Escape"); await expect(drawer).toHaveCount(0);
  await expect(page.locator("main").getByRole("button", { name: "THÊM VÀO GIỎ", exact: true }).first()).toBeFocused();
  await add(page);
  await expect(drawer.getByRole("heading", { name: "GIỎ HÀNG (2)", exact: true })).toBeVisible();
  await expect(drawer.getByRole("button", { name: /^Tăng số lượng/ })).toBeDisabled();
  if (width >= 640) { await page.locator('[data-slot="sheet-overlay"]').click({ position: { x: 5, y: 200 }, force: true }); await expect(drawer).toHaveCount(0); await page.getByRole("button", { name: "Mở giỏ hàng", exact: true }).click(); }
  await drawer.getByRole("link", { name: "XEM GIỎ HÀNG", exact: true }).click(); await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByTestId("cart-total")).toHaveText("428.000₫");
  await page.getByLabel("Ghi chú đơn hàng", { exact: true }).fill("Giao vào buổi sáng"); await page.reload(); await ready(page);
  await expect(page.getByLabel("Ghi chú đơn hàng", { exact: true })).toHaveValue("Giao vào buổi sáng");
  await expect(page.getByTestId("cart-count")).toHaveText("2"); await expect(page.getByTestId("cart-total")).toHaveText("428.000₫"); await settled(page);
  await noOverflow(page); await page.screenshot({ path: `test-results/phase8-cart-${width}.png`, fullPage: true, caret: "initial" });
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("cham-cart-v1")!));
  expect(Object.keys(saved.state).sort()).toEqual(["discountCode", "lines", "note"]); expect(Object.keys(saved.state.lines[0]).sort()).toEqual(["quantity", "variantId"]);
  await page.getByRole("button", { name: /^Xóa Áo thun hai màu/ }).click();
  await expect(page.getByText("Giỏ hàng của bạn đang trống", { exact: true })).toBeVisible(); await page.reload(); await ready(page); await expect(page.getByTestId("cart-count")).toHaveCount(0);
});

test("fresh database prices follow an admin edit and opening the drawer refreshes them", async ({ page, context }) => {
  const ids = fixture(); await page.goto("/products/ao-thun-hai-mau"); await ready(page); await add(page); await page.keyboard.press("Escape");
  const admin = await context.newPage(); await login(admin); await admin.goto(`/admin/products/${ids.productId}`); await admin.locator('[data-catalog-ready="true"]').waitFor();
  await admin.getByLabel("Thứ tự nổi bật", { exact: true }).fill("0");
  await admin.getByLabel("Giá bán * (VND)", { exact: true }).fill("249000"); await admin.getByRole("button", { name: "Lưu sản phẩm", exact: true }).click(); await expect(admin.getByText("Đã lưu", { exact: true })).toBeVisible(); await admin.close();
  await page.getByRole("button", { name: "Mở giỏ hàng", exact: true }).click();
  await expect(page.getByRole("dialog").getByTestId("cart-unit-price")).toHaveText("249.000₫"); await expect(page.getByRole("dialog").getByTestId("drawer-total")).toHaveText("279.000₫");
});

test("reduced stock reconciles persisted quantity and unavailable lines remain removable", async ({ page }) => {
  await page.goto("/products/ao-thun-hai-mau"); await ready(page); await add(page);
  await page.getByRole("dialog").getByRole("button", { name: /^Tăng số lượng/ }).click(); await settled(page); await page.getByRole("dialog").getByRole("link", { name: "XEM GIỎ HÀNG", exact: true }).click();
  await expect(page.getByTestId("cart-total")).toHaveText("428.000₫"); fixture("reduce"); await page.getByRole("button", { name: "Cập nhật giỏ hàng", exact: true }).click();
  await expect(page.getByRole("spinbutton", { name: /^Số lượng Áo thun/ })).toHaveValue("1"); await expect(page.getByText("Chỉ còn 1 sản phẩm. Số lượng đã được cập nhật.", { exact: true })).toBeVisible(); await expect(page.getByTestId("cart-total")).toHaveText("229.000₫"); await settled(page);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("cham-cart-v1")!).state.lines[0].quantity)).toBe(1);
  fixture("reset"); await page.getByRole("button", { name: "Cập nhật giỏ hàng", exact: true }).click(); await settled(page);
  await expect(page.getByText("Chỉ còn 1 sản phẩm. Số lượng đã được cập nhật.", { exact: true })).toHaveCount(0);
  fixture("empty"); await page.getByRole("button", { name: "Cập nhật giỏ hàng", exact: true }).click();
  await expect(page.getByText("Sản phẩm đã hết hàng. Vui lòng xóa khỏi giỏ hàng.", { exact: true })).toBeVisible(); await expect(page.getByTestId("cart-total")).toHaveText("0₫"); await settled(page);
  await expect(page.getByRole("button", { name: "THANH TOÁN", exact: true })).toBeDisabled();
  fixture("archive"); await page.getByRole("button", { name: "Cập nhật giỏ hàng", exact: true }).click();
  await expect(page.getByText("Sản phẩm đã ngừng bán. Vui lòng xóa khỏi giỏ hàng.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^Xóa Áo thun/ }).click(); await expect(page.getByText("Giỏ hàng của bạn đang trống", { exact: true })).toBeVisible();
});

test("server shipping progress supports item and amount thresholds", async ({ page }) => {
  const ids = fixture();
  await page.goto("/cart"); await ready(page);
  await page.evaluate((ids) => localStorage.setItem("cham-cart-v1", JSON.stringify({ state: { lines: [{ variantId: ids.blackId, quantity: 2 }, { variantId: ids.whiteId, quantity: 1 }], note: "", discountCode: "" }, version: 1 })), ids);
  await page.reload(); await ready(page); await expect(page.getByTestId("cart-total")).toHaveText("597.000₫"); await expect(page.getByTestId("free-ship-progress")).toContainText("Bạn đã được miễn phí vận chuyển");
  await page.getByRole("spinbutton", { name: /Số lượng Áo thun hai màu Đen M/ }).fill("1"); await expect(page.getByTestId("cart-total")).toHaveText("428.000₫"); await settled(page);
  fixture("amount-shipping"); await page.getByRole("button", { name: "Cập nhật giỏ hàng", exact: true }).click();
  await expect(page.getByTestId("free-ship-progress")).toContainText("Mua thêm 102.000₫"); await expect(page.getByTestId("cart-shipping")).toHaveText("45.000₫");
});

test("mobile sticky add opens the real drawer and cart edits synchronize across tabs", async ({ page, context }) => {
  await page.setViewportSize({ width: 375, height: 900 }); await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/products/ao-thun-hai-mau"); await ready(page); await page.getByRole("button", { name: "M", exact: true }).click();
  await page.getByRole("region", { name: "SẢN PHẨM LIÊN QUAN", exact: true }).scrollIntoViewIfNeeded();
  await page.locator("[data-sticky-buy-bar]").getByRole("button", { name: "THÊM VÀO GIỎ", exact: true }).click();
  await expect(page.getByRole("dialog").getByTestId("cart-line")).toHaveCount(1); await page.getByRole("dialog").getByRole("link", { name: "XEM GIỎ HÀNG", exact: true }).click();
  await expect(page.getByTestId("cart-total")).toHaveText("229.000₫"); await settled(page);
  const other = await context.newPage(); await other.goto("/cart"); await ready(other); await expect(other.getByTestId("cart-count")).toHaveText("1");
  await page.getByRole("button", { name: /^Tăng số lượng/ }).click(); await expect(other.getByTestId("cart-count")).toHaveText("2"); await expect(other.getByTestId("cart-total")).toHaveText("428.000₫");
  await other.getByRole("button", { name: /^Xóa Áo thun/ }).click(); await expect(page.getByText("Giỏ hàng của bạn đang trống", { exact: true })).toBeVisible(); await other.close();
});

test("network errors keep the last quote, retry recovers, and stale responses cannot replace a newer cart", async ({ page }) => {
  await page.goto("/products/ao-thun-hai-mau"); await ready(page); await add(page); await page.getByRole("dialog").getByRole("link", { name: "XEM GIỎ HÀNG", exact: true }).click(); await settled(page);
  await page.route("**/api/cart/quote", (route) => route.abort()); await page.getByRole("button", { name: "Cập nhật giỏ hàng", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText("Chưa tải được giỏ hàng"); await expect(page.getByTestId("cart-total")).toHaveText("229.000₫");
  await page.unroute("**/api/cart/quote"); await page.getByRole("button", { name: "Thử lại", exact: true }).click(); await expect(page.locator("main").getByRole("alert")).toHaveCount(0); await settled(page);
  let release: (() => void) | undefined;
  const held = new Promise<void>((resolve) => { release = resolve; });
  let started: (() => void) | undefined;
  const received = new Promise<void>((resolve) => { started = resolve; });
  await page.route("**/api/cart/quote", async (route) => {
    const data: { lines: { quantity: number }[] } = route.request().postDataJSON();
    if (data.lines[0]?.quantity === 1) { const response = await route.fetch(); started?.(); await held; await route.fulfill({ response }).catch(() => undefined); }
    else await route.continue();
  });
  await page.getByRole("button", { name: "Cập nhật giỏ hàng", exact: true }).click(); await received;
  await expect(page.getByTestId("cart-total")).toHaveText("229.000₫");
  await page.getByRole("button", { name: /^Tăng số lượng/ }).click(); await expect(page.getByTestId("cart-total")).toHaveText("428.000₫"); release?.(); await settled(page);
  await expect(page.getByRole("spinbutton", { name: /^Số lượng Áo thun/ })).toHaveValue("2"); await expect(page.getByTestId("cart-total")).toHaveText("428.000₫");
});

test("quote API validates input, ignores client prices, handles deleted ids and rate limits requests", async ({ request }) => {
  const { blackId } = fixture(); const lines = [{ variantId: blackId, quantity: 1 }];
  const quote = await request.post("/api/cart/quote", { data: { lines, unitPrice: 1, total: 1 } });
  expect(quote.status()).toBe(200); expect(quote.headers()["cache-control"]).toBe("no-store"); expect(await quote.json()).toMatchObject({ ok: true, data: { subtotal: 199000, total: 229000 } });
  for (const data of [{ lines: [...lines, ...lines] }, { lines: [{ variantId: blackId, quantity: 11 }] }, { lines: [{ variantId: "bad", quantity: 1 }] }, { lines: Array.from({ length: 21 }, () => ({ variantId: randomUUID(), quantity: 1 })) }, { lines, discountCode: "SALE" }]) {
    const response = await request.post("/api/cart/quote", { data }); expect(response.status()).toBe(400); expect(response.headers()["cache-control"]).toBe("no-store"); expect(await response.json()).toMatchObject({ ok: false, error: { code: "VALIDATION_ERROR" } });
  }
  expect((await request.post("/api/cart/quote", { data: "{broken", headers: { "Content-Type": "application/json" } })).status()).toBe(400);
  expect(await (await request.post("/api/cart/quote", { data: { lines: [{ variantId: randomUUID(), quantity: 1 }] } })).json()).toMatchObject({ ok: true, data: { total: 0, lines: [{ issue: "UNAVAILABLE" }] } });
  expect(await (await request.post("/api/cart/quote", { data: { lines: [] } })).json()).toMatchObject({ ok: true, data: { itemCount: 0, subtotal: 0, shippingFee: 0, total: 0 } });
  const statuses = await Promise.all(Array.from({ length: 61 }, async () => (await request.post("/api/cart/quote", { data: { lines: [] }, headers: { "x-forwarded-for": "203.0.113.239" } })).status()));
  expect(statuses.filter((status) => status === 200)).toHaveLength(60); expect(statuses.filter((status) => status === 429)).toHaveLength(1);
});
