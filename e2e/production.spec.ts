import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

function fixture(command = "read"): { count: number; total: number; quantity: number; stock: number; movements: number } {
  return JSON.parse(execFileSync(process.execPath, ["--conditions=react-server", "--import=tsx", "e2e/checkout-fixture.ts", command], { encoding: "utf8" }));
}
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); }
async function noIndex(page: Page) {
  const metadata = page.locator('meta[name="robots"]');
  // Wait for Next's streamed metadata to replace the previous route's head.
  await expect(metadata).toHaveCount(1); await expect(metadata).toHaveAttribute("content", /noindex/);
}
async function login(page: Page, role = "admin") {
  await page.goto("/admin/login"); await page.getByLabel("Email", { exact: true }).fill(`${role}@example.test`); await page.getByLabel("Mật khẩu", { exact: true }).fill("E2e-private-password-12345"); await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(page).toHaveURL(/\/admin$/);
}
async function purchase(page: Page, bank = false) {
  await page.goto("/"); await page.getByRole("link", { name: "XEM TẤT CẢ BEST SELLER", exact: true }).click(); await expect(page).toHaveURL(/\/collections\/best-seller$/);
  await page.getByTestId("product-card").filter({ hasText: "Áo thun hai màu" }).click(); await expect(page).toHaveURL(/\/products\/ao-thun-hai-mau$/);
  await page.locator('[data-cart-ready="true"]').first().waitFor(); await page.getByRole("button", { name: "Màu Đen", exact: true }).click(); await page.getByRole("button", { name: "M", exact: true }).click();
  await page.getByRole("button", { name: "THÊM VÀO GIỎ", exact: true }).first().click(); const drawer = page.getByRole("dialog"); await expect(drawer).toBeVisible(); await expect(drawer.getByTestId("drawer-total")).toHaveText("229.000₫");
  await drawer.getByRole("link", { name: "XEM GIỎ HÀNG", exact: true }).click(); await expect(page).toHaveURL(/\/cart$/); await page.getByRole("button", { name: "THANH TOÁN", exact: true }).click(); await expect(page).toHaveURL(/\/checkout$/); await page.locator('[data-checkout-ready="true"]').waitFor();
  await page.getByLabel("Họ và tên *", { exact: true }).fill("Khách kiểm thử"); await page.getByLabel("Số điện thoại *", { exact: true }).fill("0912345678"); await page.getByLabel("Email nhận xác nhận đơn", { exact: true }).fill("customer@example.test");
  await page.getByLabel("Tỉnh / Thành phố *", { exact: true }).selectOption("Hà Nội"); await page.getByLabel("Phường / Xã *", { exact: true }).fill("Phường kiểm thử"); await page.getByLabel("Địa chỉ cụ thể *", { exact: true }).fill("Địa chỉ dùng riêng cho kiểm thử"); await page.getByRole("checkbox").check();
  if (bank) await page.getByLabel("Chuyển khoản ngân hàng", { exact: true }).check();
  await noOverflow(page); await page.getByRole("button", { name: "ĐẶT HÀNG", exact: true }).click(); await expect(page).toHaveURL(/\/checkout\/success\?code=.*&t=/); await expect(page.getByTestId("receipt-total")).toHaveText("229.000₫");
  await noIndex(page); expect(fixture()).toMatchObject({ count: 1, total: 229000, quantity: 1, stock: 1, movements: 1 });
  return page.getByTestId("order-code").innerText();
}
async function transition(page: Page, label: string) { await page.getByRole("button", { name: label, exact: true }).click(); await page.getByRole("dialog").getByRole("button", { name: "Xác nhận", exact: true }).click(); await expect(page.getByRole("dialog")).toBeHidden(); }
const errors = new Map<string, string[]>();
test.beforeEach(async ({ page, context }, info) => {
  fixture("reset"); await context.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${info.testId.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0) % 200 + 1}` }); await page.emulateMedia({ reducedMotion: "reduce" });
  await context.route("https://img.vietqr.io/**", (route) => route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="white"/><text x="20" y="250">QR test fixture</text></svg>' }));
  const list: string[] = []; errors.set(info.testId, list); page.on("pageerror", (error) => list.push(error.message)); page.on("console", (message) => { if (message.type() === "error" && /hydrat|server rendered/i.test(message.text())) list.push(message.text()); });
});
test.afterEach(async ({}, info) => { expect(errors.get(info.testId)).toEqual([]); errors.delete(info.testId); });

for (const width of [375, 768, 1280]) test(`production COD checkout → admin fulfillment → public lookup at ${width}px`, async ({ page, browser }) => {
  await page.setViewportSize({ width, height: 900 }); const code = await purchase(page); await noOverflow(page); await page.screenshot({ path: `test-results/phase12-receipt-${width}.png`, fullPage: true, caret: "initial" });
  await login(page); await page.goto(`/admin/orders?q=${code}`); await page.getByRole("link", { name: code, exact: true }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/admin\/orders\/[0-9a-f-]+$/);
  const url = page.url();
  const requestPromise = page.waitForRequest((request) => request.method() === "POST" && new URL(request.url()).pathname === new URL(url).pathname && Boolean(request.headers()["next-action"]));
  await transition(page, "Xác nhận đơn"); const captured = await requestPromise;
  await page.getByRole("button", { name: "Chuyển sang Đang giao", exact: true }).click(); const dialog = page.getByRole("dialog"); await dialog.getByLabel("Hãng vận chuyển (chọn hoặc nhập Khác)").fill("GHN"); await dialog.getByLabel("Mã vận đơn", { exact: true }).fill("PROD-TRACK-12"); await dialog.getByRole("button", { name: "Xác nhận", exact: true }).click(); await expect(dialog).toBeHidden(); await transition(page, "Hoàn thành");
  await expect(page.getByText("Đã nhận tiền COD khi hoàn thành đơn", { exact: true })).toBeVisible(); expect(fixture().stock).toBe(1); await noOverflow(page);
  const orderId = new URL(url).pathname.split("/").at(-1)!;
  await expect.poll(() => readFileSync("test-results/phase12-notifications.jsonl", "utf8")).toContain(`order-shipped/${orderId}`);
  const anonymous = await browser.newContext();
  try {
    const replay = await anonymous.request.post(url, { data: captured.postData()!, headers: { "next-action": captured.headers()["next-action"], "Content-Type": captured.headers()["content-type"], Accept: "text/x-component", Origin: "http://localhost:3100" } });
    const body = await replay.text(); expect(body).toContain("UNAUTHORIZED"); expect(body).not.toContain("customer@example.test");
  } finally { await anonymous.close(); }
  await page.goto("/kiem-tra-don-hang"); await page.locator('form[data-ready="true"]').waitFor(); await page.getByLabel("Mã đơn hàng", { exact: true }).fill(code); await page.getByLabel("Số điện thoại đặt hàng", { exact: true }).fill("0912345678"); await page.getByRole("button", { name: "TRA CỨU ĐƠN HÀNG", exact: true }).click();
  const result = page.getByRole("region", { name: "Kết quả tra cứu đơn hàng" }); await expect(result).toContainText("Hoàn thành"); await expect(result).toContainText("0912***678"); await expect(result).toContainText("PROD-TRACK-12"); await noOverflow(page); await page.screenshot({ path: `test-results/phase12-lookup-${width}.png`, fullPage: true, caret: "initial" });
});
test("production transfer checkout has the exact server total and payment reference in VietQR", async ({ page }) => {
  const code = await purchase(page, true); const qr = page.getByRole("img", { name: `Mã VietQR thanh toán đơn ${code}`, exact: true }); await expect(qr).toBeVisible();
  const url = new URL((await qr.getAttribute("src"))!); expect(url.hostname).toBe("img.vietqr.io"); expect(url.pathname).toBe("/image/970436-123456789-compact2.png"); expect(url.searchParams.get("amount")).toBe("229000"); expect(url.searchParams.get("addInfo")).toBe(code); await expect(page.locator('meta[name="referrer"]')).toHaveAttribute("content", "no-referrer");
});
test("production metadata, structured data, sitemap, robots and approved policy text", async ({ page, request }) => {
  await page.goto("/"); await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/); expect(new URL((await page.locator('link[rel="canonical"]').getAttribute("href"))!).href).toBe("http://localhost:3100/"); expect(await page.locator('script[type="application/ld+json"]').first().textContent()).toContain('"Organization"');
  await page.goto("/products/ao-thun-hai-mau?test=ignored"); await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "http://localhost:3100/products/ao-thun-hai-mau"); await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /phase7-tests\/detail.svg/);
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents(); const data = blocks.map((text) => JSON.parse(text)); expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ "@type": "Product", sku: "DETAIL01", offers: expect.objectContaining({ price: 199000, priceCurrency: "VND", availability: "https://schema.org/InStock" }) }), expect.objectContaining({ "@type": "BreadcrumbList" })]));
  await page.goto("/collections/best-seller?page=2&sort=price-asc"); await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "http://localhost:3100/collections/best-seller");
  const sitemap = await request.get("/sitemap.xml"); expect(sitemap.status()).toBe(200); const xml = await sitemap.text(); for (const path of ["/products/ao-thun-hai-mau", "/collections/best-seller", "/lien-he", "/chinh-sach-bao-mat"]) expect(xml).toContain(path); for (const path of ["/products/ao-thun-25", "/products/ao-thun-26", "/products/ao-trong-nhom-an", "/admin", "/checkout", "/kiem-tra-don-hang"]) expect(xml).not.toContain(path);
  const robots = await (await request.get("/robots.txt")).text(); for (const path of ["/admin", "/checkout", "/cart", "/api", "/kiem-tra-don-hang"]) expect(robots).toContain(`Disallow: ${path}`); expect(robots).toContain("Sitemap: http://localhost:3100/sitemap.xml");
  await page.goto("/chinh-sach-bao-mat"); await expect(page.getByText("Nội dung mẫu đang chờ chủ shop rà soát trước khi áp dụng chính thức.", { exact: true })).toHaveCount(0);
});
test("lazy storefront dialogs retain keyboard focus and the product accordion works natively", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 }); await page.goto("/");
  await page.getByRole("button", { name: "Mở menu", exact: true }).click(); await expect(page.getByRole("dialog")).toBeVisible(); await page.getByRole("dialog").press("Escape"); await expect(page.getByRole("dialog")).toBeHidden(); await expect(page.getByRole("button", { name: "Mở menu", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Mở tìm kiếm", exact: true }).click(); await expect(page.getByRole("dialog")).toBeVisible();
  const headerBottom = await page.locator("#shop-header").evaluate((element) => element.getBoundingClientRect().bottom);
  await expect.poll(async () => Math.round((await page.getByRole("dialog").boundingBox())!.y)).toBe(Math.round(headerBottom));
  await page.getByRole("dialog").press("Escape"); await expect(page.getByRole("dialog")).toBeHidden(); await expect(page.getByRole("button", { name: "Mở tìm kiếm", exact: true })).toBeFocused();
  await page.locator('[data-cart-ready="true"]').first().waitFor(); await page.getByRole("button", { name: "Mở giỏ hàng", exact: true }).click(); await expect(page.getByRole("dialog")).toBeVisible(); await page.getByRole("dialog").press("Escape"); await expect(page.getByRole("dialog")).toBeHidden(); await expect(page.getByRole("button", { name: "Mở giỏ hàng", exact: true })).toBeFocused();
  await page.goto("/products/ao-thun-hai-mau"); await page.getByRole("button", { name: "Hướng dẫn chọn size", exact: true }).click(); await expect(page.getByRole("dialog")).toBeVisible(); await page.getByRole("dialog").press("Escape"); await expect(page.getByRole("dialog")).toBeHidden();
  const size = page.locator("details").filter({ has: page.getByRole("heading", { name: "BẢNG SIZE", exact: true }) }); await size.locator("summary").click(); await expect(size.getByRole("table")).toBeVisible(); await noOverflow(page);
});
test("production private headers, anonymous endpoints and staff permissions cannot be bypassed", async ({ page, request }) => {
  for (const path of ["/admin/orders", "/checkout", "/kiem-tra-don-hang", "/api/cart/quote"]) {
    const response = await request.get(path, { maxRedirects: 0 }); const headers = response.headers(); expect(headers["x-robots-tag"]).toContain("noindex"); expect(headers["x-content-type-options"]).toBe("nosniff"); expect(headers["x-frame-options"]).toBe("DENY"); expect(headers["permissions-policy"]).toBe("camera=(), microphone=(), geolocation=()");
  }
  expect((await request.get("/api/admin/orders/export")).status()).toBe(401); expect((await request.post("/api/admin/upload", { multipart: { folder: "products", file: { name: "test.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5WZ3cAAAAASUVORK5CYII=", "base64") } } })).status()).toBe(401);
  for (const path of ["sign-up/email", "admin/create-user", "admin/set-role", "admin/ban-user", "admin/remove-user"]) expect((await request.post(`/api/auth/${path}`, { data: {} })).status()).toBe(403);
  expect((await request.post("/api/cart/quote", { data: { lines: [{ variantId: "invalid", quantity: -1 }] } })).status()).toBe(400);
  await login(page, "staff"); await page.goto("/admin/settings"); await expect(page).toHaveURL(/\/admin\/forbidden$/); expect((await page.request.get("/api/admin/orders/export")).status()).toBe(403); await noIndex(page);
});

test("admin price edits invalidate the production product ISR page and structured data", async ({ page, context }) => {
  const ids: { productId: string } = JSON.parse(execFileSync(process.execPath, ["--conditions=react-server", "--import=tsx", "e2e/cart-fixture.ts", "read"], { encoding: "utf8" }));
  await page.goto("/products/ao-thun-hai-mau");
  const admin = await context.newPage();
  try {
    await login(admin); await admin.goto(`/admin/products/${ids.productId}`); await admin.locator('[data-catalog-ready="true"]').waitFor();
    await admin.getByLabel("Thứ tự nổi bật", { exact: true }).fill("0");
    await admin.getByLabel("Giá bán * (VND)", { exact: true }).fill("249000");
    await admin.getByRole("button", { name: "Lưu sản phẩm", exact: true }).click(); await expect(admin.getByText("Đã lưu", { exact: true })).toBeVisible();
    await page.reload();
    const data = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((text) => JSON.parse(text));
    expect(data).toEqual(expect.arrayContaining([expect.objectContaining({ "@type": "Product", offers: expect.objectContaining({ price: 249000 }) })]));
    await expect(page.locator("main").getByText("249.000₫", { exact: true }).first()).toBeVisible();
  } finally { await admin.close(); }
});

test("concurrent first visits finish cold product ISR generation", async ({ request }) => {
  const responses = await Promise.all(Array.from({ length: 4 }, () => request.get("/products/ao-thun-11")));
  for (const response of responses) {
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('"sku":"BROWSE11"');
    expect(html).toContain('"price":110000');
    expect(html).toContain("Áo thun 11");
    expect(["MISS", "HIT"]).toContain(response.headers()["x-nextjs-cache"]);
  }
});
