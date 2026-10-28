import { expect, test, type Page, type BrowserContext } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
const paths: string[] = [], pending: Promise<void>[] = [], errors = new Map<string, string[]>();
async function login(page: Page, role = "admin") { await page.goto("/admin/login"); await page.getByLabel("Email", { exact: true }).fill(`${role}@example.test`); await page.getByLabel("Mật khẩu", { exact: true }).fill("E2e-private-password-12345"); await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(page).toHaveURL(/\/admin$/); }
async function image(page: Page, width: number, height: number) {
  const data = await page.evaluate(({ width, height }) => { const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height; const context = canvas.getContext("2d")!; context.fillStyle = "#a69987"; context.fillRect(0, 0, width, height); return canvas.toDataURL("image/png").split(",")[1]; }, { width, height });
  return { name: "content-test.png", mimeType: "image/png", buffer: Buffer.from(data, "base64") };
}
async function cache(context: BrowserContext, slug?: string, reset = false) { const params = new URLSearchParams(); if (slug) params.set("slug", slug); if (reset) params.set("reset", "1"); const response = await context.request.get(`/api/phase5-cache-probe?${params}`); expect(response.status()).toBe(200); return response.json(); }
async function widthCheck(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth)); }
async function saveSettingForm(page: Page, name: string) { const button = page.getByRole("button", { name, exact: true }); const form = button.locator("xpath=ancestor::form"); await button.click(); await expect(form).toHaveAttribute("data-setting-dirty", "false"); }
test.beforeEach(async ({ context, page }, info) => {
  await context.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${info.testId.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0) % 200 + 1}` });
  const list: string[] = []; errors.set(info.testId, list); page.on("pageerror", (error) => list.push(error.message)); page.on("console", (message) => { if (message.type() === "error" && /hydrat|didn't match/i.test(message.text())) list.push(message.text()); });
  page.on("response", (response) => { if (response.url().endsWith("/api/admin/upload") && response.status() === 200) pending.push(response.json().then((value: { ok: boolean; data?: { path: string } }) => { if (value.ok && value.data) paths.push(value.data.path); })); });
});
test.afterEach(async ({ page }, info) => { page.removeAllListeners("console"); page.removeAllListeners("pageerror"); expect(errors.get(info.testId) ?? []).toEqual([]); errors.delete(info.testId); });
test.afterAll(async () => { await Promise.all(pending); if (paths.length && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) { const result = await createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } }).storage.from("media").remove(paths); if (result.error) throw new Error("Không dọn được ảnh content test"); } });

test("staff creates and orders a collection, protects shared slugs and updates cached menu", async ({ page, context }) => {
  await login(page, "staff"); await cache(context, undefined, true);
  await page.goto("/admin/collections/new"); await page.locator('[data-content-ready="true"]').waitFor();
  await page.getByLabel("Tên bộ sưu tập", { exact: true }).fill("Bộ sưu tập thử"); await page.getByLabel("Đường dẫn", { exact: true }).fill("ao-thun");
  await page.getByRole("button", { name: "Thêm sản phẩm", exact: true }).click(); const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Tìm sản phẩm cho bộ sưu tập").fill("áo kiểm thử");
  await dialog.getByRole("checkbox", { name: "Chọn Áo kiểm thử", exact: true }).check(); await dialog.getByRole("checkbox", { name: "Chọn Áo kiểm thử hai", exact: true }).check();
  await dialog.getByRole("button", { name: "Thêm 2 sản phẩm", exact: true }).click(); await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Đưa sản phẩm 2 lên", exact: true }).click(); await page.getByRole("checkbox", { name: "Hiện trên menu", exact: true }).check(); await page.getByRole("checkbox", { name: "Hiện trên trang chủ", exact: true }).check();
  await page.getByRole("button", { name: "Lưu bộ sưu tập", exact: true }).click(); await expect(page.locator("#collection-slug-error")).toContainText("đã được sử dụng");
  await page.getByLabel("Đường dẫn", { exact: true }).fill("bo-suu-tap-thu"); await page.getByRole("button", { name: "Lưu bộ sưu tập", exact: true }).click(); await expect(page).toHaveURL(/\/admin\/collections\/[a-f0-9-]{36}$/);
  const data = await cache(context, "bo-suu-tap-thu"); expect(data.menu).toContainEqual({ title: "Bộ sưu tập thử", slug: "bo-suu-tap-thu" }); expect(data.listing).toEqual(["Áo kiểm thử hai", "Áo kiểm thử"]);
  await page.reload(); await expect(page.getByText("Áo kiểm thử hai", { exact: true })).toBeVisible();
  await page.goto("/admin/settings"); await expect(page).toHaveURL(/\/admin\/forbidden$/);
});
test("admin saves settings and immediately invalidates warm public settings cache", async ({ page, context }) => {
  await login(page); const before = await cache(context); expect(before.shipping.fee).toBe(30000);
  await page.goto("/admin/settings"); await page.locator('[data-content-ready="true"]').waitFor(); await page.getByLabel("Số điện thoại", { exact: true }).fill("0912345678"); await saveSettingForm(page, "Lưu thông tin shop");
  expect((await cache(context)).shop.phone).toBe("0912345678");
  await page.getByRole("button", { name: "Vận chuyển", exact: true }).click(); await page.getByLabel("Phí vận chuyển (VND)", { exact: true }).fill("45000"); await page.getByLabel("Miễn phí từ số sản phẩm", { exact: true }).fill(""); await page.getByLabel("Miễn phí từ giá trị đơn (VND)", { exact: true }).fill("500000");
  await saveSettingForm(page, "Lưu vận chuyển"); expect((await cache(context)).shipping).toEqual({ fee: 45000, freeShipMinItems: null, freeShipMinAmount: 500000 });
  await page.getByLabel("Phí vận chuyển (VND)", { exact: true }).fill("-1"); await page.getByRole("button", { name: "Lưu vận chuyển", exact: true }).click(); expect((await cache(context)).shipping.fee).toBe(45000);
  page.once("dialog", (prompt) => prompt.dismiss()); await page.getByRole("button", { name: "Mạng xã hội", exact: true }).click(); await expect(page.getByLabel("Phí vận chuyển (VND)", { exact: true })).toBeVisible();
  page.once("dialog", (prompt) => prompt.accept()); await page.getByRole("button", { name: "Thanh toán", exact: true }).click();
  await page.getByLabel("Ngân hàng", { exact: true }).selectOption("970436"); await page.getByLabel("Số tài khoản", { exact: true }).fill("123456789"); await page.getByLabel("Tên chủ tài khoản", { exact: true }).fill("Nguyễn Đỏ");
  await expect(page.getByLabel("Tên chủ tài khoản", { exact: true })).toHaveValue("NGUYEN DO"); const qr = page.getByRole("img", { name: "Mã VietQR xem trước 10.000 đồng", exact: true }); await expect(qr).toHaveAttribute("src", /amount=10000/);
  await saveSettingForm(page, "Lưu thanh toán"); expect((await cache(context)).bankTransferEnabled).toBe(true);
});
test("announcement policy social legal order and SEO forms save independently", async ({ page, context }) => {
  await login(page); await page.goto("/admin/settings");
  await page.getByRole("button", { name: "Thông báo & cam kết", exact: true }).click(); await page.getByLabel("Thông báo 1", { exact: true }).fill("Thông báo kiểm thử"); await page.getByRole("button", { name: "Thêm thông báo", exact: true }).click(); await page.getByLabel("Thông báo 2", { exact: true }).fill("Thông báo thứ hai"); await page.getByRole("button", { name: "Đưa thông báo 2 lên", exact: true }).click(); await saveSettingForm(page, "Lưu thông báo"); expect((await cache(context)).announcements).toEqual(["Thông báo thứ hai", "Thông báo kiểm thử"]);
  await page.getByLabel("Nội dung cam kết 1", { exact: true }).fill("Cam kết kiểm thử"); await saveSettingForm(page, "Lưu cam kết");
  await page.getByLabel("Tóm tắt chính sách đổi trả", { exact: true }).fill("Chính sách do shop cung cấp"); await saveSettingForm(page, "Lưu tóm tắt đổi trả"); expect((await cache(context)).returnPolicySummary).toBe("Chính sách do shop cung cấp");
  await page.getByRole("button", { name: "Mạng xã hội", exact: true }).click(); await page.getByLabel("Facebook", { exact: true }).fill("https://example.test/shop"); await saveSettingForm(page, "Lưu mạng xã hội");
  await page.getByRole("button", { name: "Pháp lý", exact: true }).click(); await page.getByLabel("Tên chủ thể kinh doanh", { exact: true }).fill("Chủ thể kiểm thử"); await saveSettingForm(page, "Lưu pháp lý");
  await page.getByRole("button", { name: "Đơn hàng", exact: true }).click(); await page.getByLabel("Tiền tố mã đơn", { exact: true }).fill("CT"); await saveSettingForm(page, "Lưu đơn hàng");
  await page.getByRole("button", { name: "SEO", exact: true }).click(); await page.getByLabel("Tiêu đề mặc định", { exact: true }).fill("Cham.stu thử nghiệm"); await saveSettingForm(page, "Lưu seo");
  await page.reload(); await page.getByRole("button", { name: "SEO", exact: true }).click(); await expect(page.getByLabel("Tiêu đề mặc định", { exact: true })).toHaveValue("Cham.stu thử nghiệm");
});
test("staff uploads desktop/mobile banners and changes warm home cache without deployment", async ({ page, context }) => {
  await login(page, "staff"); const before = await cache(context); expect(before.banners).toEqual([]);
  await page.goto("/admin/banners"); await page.getByRole("button", { name: "Thêm banner", exact: true }).click(); const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Tiêu đề nội bộ", { exact: true }).fill("Banner kiểm thử"); await dialog.getByLabel("Tải ảnh desktop", { exact: true }).setInputFiles(await image(page, 1000, 400)); await expect(dialog.getByRole("img", { name: "Ảnh desktop", exact: true })).toBeVisible();
  await dialog.getByLabel("Tải ảnh mobile", { exact: true }).setInputFiles(await image(page, 400, 500)); await expect(dialog.getByRole("img", { name: "Ảnh mobile", exact: true })).toBeVisible();
  await dialog.getByLabel("Mô tả ảnh (alt)", { exact: true }).fill("Ảnh banner kiểm thử"); await dialog.getByLabel("Liên kết", { exact: true }).fill("/collections/all"); await dialog.getByLabel("Bắt đầu (giờ Việt Nam)", { exact: true }).fill("2020-01-01T00:00"); await dialog.getByLabel("Kết thúc (giờ Việt Nam)", { exact: true }).fill("2099-01-01T00:00");
  await expect(dialog.getByRole("heading", { name: "Xem trước", exact: true })).toBeVisible(); await dialog.getByRole("button", { name: "Lưu banner", exact: true }).click(); await expect(dialog).not.toBeVisible();
  expect((await cache(context)).banners).toEqual([{ title: "Banner kiểm thử", href: "/collections/all", ctaLabel: "MUA NGAY" }]);
  await page.getByRole("button", { name: "Sửa Banner kiểm thử", exact: true }).click(); await dialog.getByLabel("Chữ trên nút", { exact: true }).fill("KHÁM PHÁ"); await dialog.getByRole("button", { name: "Lưu banner", exact: true }).click(); await expect(dialog).not.toBeVisible(); expect((await cache(context)).banners[0].ctaLabel).toBe("KHÁM PHÁ");
  await page.getByLabel("Hiển thị Banner kiểm thử", { exact: true }).uncheck(); await expect.poll(async () => (await cache(context)).banners.length).toBe(0);
});
for (const width of [375, 768, 1280]) test(`content admin responsive at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); await login(page);
  for (const [path, name] of [["/admin/collections", "collections"], ["/admin/collections/new", "collection-editor"], ["/admin/banners", "banners"], ["/admin/settings", "settings"]]) { await page.goto(path); await page.locator('[data-content-ready="true"]').waitFor(); if (name === "collection-editor") await expect(page.getByText("Có thay đổi chưa lưu", { exact: true })).not.toBeVisible(); await widthCheck(page); await page.screenshot({ path: `test-results/${name}-${width}.png`, fullPage: true }); }
  for (const label of ["Thông báo & cam kết", "Vận chuyển", "Thanh toán", "Pháp lý", "Đơn hàng", "SEO"]) { await page.getByRole("button", { name: label, exact: true }).click(); await widthCheck(page); }
});
