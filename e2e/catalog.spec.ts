import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const uploadedPaths: string[] = [], uploadedUrls: string[] = [], pendingUploads: Promise<void>[] = [];
const browserErrors = new Map<string, string[]>();
async function login(page: Page, role = "staff") {
  await page.goto("/admin/login"); await page.getByLabel("Email", { exact: true }).fill(`${role}@example.test`); await page.getByLabel("Mật khẩu", { exact: true }).fill("E2e-private-password-12345");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(page).toHaveURL(/\/admin$/);
}
async function fixtures(page: Page, total: number, width = 800, height = 400) {
  const urls = await page.evaluate(({ total, width, height }) => Array.from({ length: total }, (_, index) => {
    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d")!; ctx.fillStyle = "#0000ff"; ctx.fillRect(0, 0, width, height); ctx.fillStyle = "#ff0000"; ctx.fillRect(10, 10, width - 20, height - 20);
    ctx.fillStyle = "#ff0000"; ctx.fillText(String(index), 100, 100); return canvas.toDataURL("image/png");
  }), { total, width, height });
  return urls.map((url, index) => ({ name: `fixture-${index}.png`, mimeType: "image/png", buffer: Buffer.from(url.split(",")[1], "base64") }));
}
async function dimensions(page: Page, url: string) {
  return page.evaluate(async (url) => {
    const image = await createImageBitmap(await (await fetch(url)).blob());
    const canvas = document.createElement("canvas"); canvas.width = image.width; canvas.height = image.height; const context = canvas.getContext("2d")!; context.drawImage(image, 0, 0);
    const pixel = (x: number, y: number) => Array.from(context.getImageData(x, y, 1, 1).data);
    return { width: image.width, height: image.height, top: pixel(600, 100), bottom: pixel(600, 1100), center: pixel(600, 600), leftEdge: pixel(5, 600), rightEdge: pixel(1195, 600) };
  }, url);
}
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth)); }
test.beforeEach(async ({ context, page }, info) => {
  await context.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${info.testId.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0) % 200 + 1}` });
  page.on("response", (response) => { if (response.url().endsWith("/api/admin/upload") && response.status() === 200) pendingUploads.push(response.json().then((result: { ok: boolean; data?: { path: string; url: string } }) => { if (result.ok && result.data) { uploadedPaths.push(result.data.path); uploadedUrls.push(result.data.url); } })); });
  const errors: string[] = []; browserErrors.set(info.testId, errors); page.on("pageerror", (error) => errors.push(error.message)); page.on("console", (message) => { if (message.type() === "error" && /hydrat|didn't match/i.test(message.text())) errors.push(message.text()); });
});
test.afterEach(async ({ page }, info) => { page.removeAllListeners("console"); page.removeAllListeners("pageerror"); expect(browserErrors.get(info.testId) ?? []).toEqual([]); browserErrors.delete(info.testId); });
test.afterAll(async () => {
  await Promise.all(pendingUploads);
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (uploadedPaths.length && url && key) {
    const { error } = await createClient(url, key, { auth: { persistSession: false } }).storage.from("media").remove(uploadedPaths);
    if (error) throw new Error("Không dọn được ảnh kiểm thử đã tải lên");
  }
});

test("upload requires a session and rejects invalid MIME/size", async ({ request }) => {
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const response = await request.post("/api/admin/upload", { multipart: { folder: "products", file: { name: "test.png", mimeType: "image/png", buffer: png } }, headers: { origin: "http://localhost:3100" } });
  expect(response.status()).toBe(401); expect(await response.json()).toMatchObject({ ok: false, error: { code: "UNAUTHORIZED" } });
  const invalid = await request.post("/api/admin/upload", { multipart: { folder: "products", file: { name: "test.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg/>") } } });
  expect(invalid.status()).toBe(400);
});
test("staff manages category tree, image and guarded deletion", async ({ page }) => {
  await login(page); await page.goto("/admin/categories");
  await page.getByRole("button", { name: "Thêm danh mục", exact: true }).click(); const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Tên danh mục", { exact: true }).fill("Phụ kiện thử");
  await dialog.getByLabel("Tải ảnh danh mục").setInputFiles(await fixtures(page, 1, 2400, 600));
  await expect(dialog.getByRole("img", { name: "Ảnh danh mục", exact: true })).toBeVisible();
  const fitUrl = await dialog.getByRole("img", { name: "Ảnh danh mục", exact: true }).getAttribute("src");
  const fitSize = await page.evaluate(async (url) => { const bitmap = await createImageBitmap(await (await fetch(url!)).blob()); return { width: bitmap.width, height: bitmap.height }; }, fitUrl);
  expect(fitSize).toEqual({ width: 1920, height: 480 });
  await dialog.getByRole("button", { name: "Lưu danh mục" }).click(); await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Phụ kiện thử", exact: true })).toBeVisible();
  await page.getByLabel("Hiển thị Phụ kiện thử", { exact: true }).uncheck(); await expect(page.getByLabel("Hiển thị Phụ kiện thử", { exact: true })).not.toBeChecked();
  await page.getByRole("button", { name: "Sửa Phụ kiện thử", exact: true }).click();
  await dialog.getByLabel("Đường dẫn", { exact: true }).fill("ao-thun"); await dialog.getByRole("button", { name: "Lưu danh mục" }).click();
  await expect(dialog.locator("#category-slug-error")).toContainText("đã được sử dụng");
  await dialog.getByLabel("Đường dẫn", { exact: true }).fill("phu-kien-thu"); await dialog.getByRole("button", { name: "Lưu danh mục" }).click(); await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Xóa Áo thun", exact: true }).click(); await dialog.getByRole("button", { name: "Xác nhận" }).click(); await expect(dialog.getByRole("alert")).toContainText("Hãy chuyển sản phẩm"); await dialog.getByRole("button", { name: "Quay lại" }).click();
});
test("creates 3 colors x 4 sizes with six resized images, updates stock and duplicates", async ({ page }) => {
  await login(page); await page.goto("/admin/products/new");
  await page.getByLabel("Tên sản phẩm *", { exact: true }).fill("Áo Phase Bốn"); await page.getByLabel("Mã sản phẩm *", { exact: true }).fill("PHASE04");
  await page.getByLabel("Giá bán * (VND)", { exact: true }).fill("199000"); await page.getByLabel("Danh mục *", { exact: true }).selectOption({ label: "↳ Áo thun" });
  await page.getByRole("button", { name: "Thêm màu", exact: true }).click(); await page.getByLabel("Tên màu 2", { exact: true }).fill("Trắng");
  await page.getByRole("button", { name: "Thêm màu", exact: true }).click(); await page.getByLabel("Tên màu 3", { exact: true }).fill("Đỏ");
  await page.getByLabel("Đặt tồn kho cho tất cả", { exact: true }).fill("5"); await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
  await expect(page.getByText("12 biến thể", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Tạo bảng size mới", exact: true }).click(); const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Tên bảng size", { exact: true }).fill("Size áo kiểm thử"); await dialog.getByRole("button", { name: "Lưu bảng size", exact: true }).click(); await expect(dialog).not.toBeVisible();
  const start = uploadedUrls.length;
  await page.getByLabel("Tải ảnh sản phẩm", { exact: true }).setInputFiles(await fixtures(page, 6));
  await expect(page.getByText("6 / 12 ảnh", { exact: true })).toBeVisible({ timeout: 90000 });
  await Promise.all(pendingUploads); expect(uploadedUrls.length - start).toBe(6);
  const checks = await dimensions(page, uploadedUrls[start]); expect(checks).toMatchObject({ width: 1200, height: 1200 });
  for (const pixel of [checks.top, checks.bottom]) expect(pixel.slice(0, 3).every((channel) => channel >= 245)).toBe(true);
  expect(checks.center[0]).toBeGreaterThan(230); expect(checks.center[1]).toBeLessThan(30);
  for (const pixel of [checks.leftEdge, checks.rightEdge]) expect(pixel[2]).toBeGreaterThan(200);
  await page.getByRole("button", { name: "Đặt ảnh 6 làm ảnh chính", exact: true }).click(); await page.getByLabel("Màu ảnh 1", { exact: true }).selectOption("trang"); await page.getByLabel("Mô tả ảnh 1", { exact: true }).fill("Ảnh áo trắng");
  await page.getByLabel("Trạng thái", { exact: true }).selectOption("active"); await page.getByRole("button", { name: "Lưu sản phẩm", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/products\/[a-f0-9-]{36}$/); await expect(page.getByLabel("Màu ảnh 1", { exact: true })).toHaveValue("trang");
  await expect(page.getByLabel("Mô tả ảnh 1", { exact: true })).toHaveValue("Ảnh áo trắng");
  await page.getByLabel("Đường dẫn", { exact: true }).fill("ao-kiem-thu"); await page.getByRole("button", { name: "Lưu sản phẩm", exact: true }).click(); await expect(page.locator("#product-slug-error")).toContainText("đã được sử dụng");
  await page.getByLabel("Đường dẫn", { exact: true }).fill("ao-phase-bon");
  await page.getByLabel("Tồn kho Đen M", { exact: true }).filter({ visible: true }).fill("7"); await page.getByLabel("Ghi chú điều chỉnh", { exact: true }).fill("Nhập thêm hai áo");
  await page.getByRole("button", { name: "Lưu sản phẩm", exact: true }).click(); await expect(page.getByText("Đã lưu", { exact: true }).last()).toBeVisible();
  await page.getByRole("tab", { name: "Lịch sử tồn kho", exact: true }).click(); await expect(page.getByText("Nhập thêm hai áo", { exact: true })).toBeVisible(); await expect(page.getByText("+2", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Thông tin sản phẩm", exact: true }).click(); await page.getByLabel("Tên sản phẩm *", { exact: true }).fill("Chưa được lưu");
  page.once("dialog", (prompt) => prompt.dismiss()); await page.getByRole("link", { name: "Danh sách sản phẩm", exact: true }).click(); await expect(page.getByLabel("Tên sản phẩm *", { exact: true })).toHaveValue("Chưa được lưu");
  page.once("dialog", (prompt) => prompt.accept()); await page.getByRole("link", { name: "Danh sách sản phẩm", exact: true }).click(); await expect(page).toHaveURL(/\/admin\/products$/);
  await page.getByRole("button", { name: "Nhân bản Áo Phase Bốn", exact: true }).filter({ visible: true }).click(); await expect(page.getByLabel("Mã sản phẩm *", { exact: true })).toHaveValue("PHASE04-COPY"); await expect(page.getByLabel("Tồn kho Đen M", { exact: true }).filter({ visible: true })).toHaveValue("0");
});
test("list filters persist on URL and archive/restore uses confirmation", async ({ page }) => {
  await login(page); await page.goto("/admin/products");
  await page.getByLabel("Tìm sản phẩm", { exact: true }).fill("SEED01"); await page.getByLabel("Sắp hết hàng", { exact: true }).check(); await page.getByRole("button", { name: "Lọc", exact: true }).click(); await expect(page).toHaveURL(/q=SEED01/); await page.reload(); await expect(page.getByLabel("Sắp hết hàng", { exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Lưu trữ Áo kiểm thử", exact: true }).filter({ visible: true }).click(); const dialog = page.getByRole("dialog"); await dialog.getByRole("button", { name: "Xác nhận", exact: true }).click(); await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Khôi phục Áo kiểm thử", exact: true }).filter({ visible: true }).click(); await dialog.getByRole("button", { name: "Xác nhận", exact: true }).click(); await expect(dialog).not.toBeVisible();
  await expect(page.getByText("Nháp", { exact: true }).filter({ visible: true })).toBeVisible();
});
for (const width of [375, 768, 1280]) test(`catalog responsive at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await login(page);
  for (const [path, name] of [["/admin/categories", "categories"], ["/admin/products", "products"], ["/admin/products/new", "product-editor"]]) {
    await page.goto(path); await page.locator('[data-catalog-ready="true"]').waitFor(); if (name === "product-editor") await expect(page.getByText("Có thay đổi chưa lưu", { exact: true })).not.toBeVisible(); await noOverflow(page); await page.screenshot({ path: `test-results/${name}-${width}.png`, fullPage: true });
  }
});
