import { expect, test, type Page } from "@playwright/test";

const errors = new Map<string, string[]>();
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth)); }
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  try {
    await page.goto("/admin/login"); await page.getByLabel("Email", { exact: true }).fill("admin@example.test"); await page.getByLabel("Mật khẩu", { exact: true }).fill("E2e-private-password-12345");
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click(); await expect(page).toHaveURL(/\/admin$/);
    expect((await page.request.get("/api/phase5-cache-probe?reset=1")).status()).toBe(200);
  } finally { await page.close(); }
});
test.beforeEach(async ({ page, context }, info) => {
  await context.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${info.testId.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0) % 200 + 1}` });
  const messages: string[] = []; errors.set(info.testId, messages);
  page.on("pageerror", (error) => { if (!error.message.includes("Temporary browsing test error")) messages.push(error.message); });
  page.on("console", (message) => { if (message.type() === "error" && /hydrat|server rendered/i.test(message.text())) messages.push(message.text()); });
});
test.afterEach(async ({}, info) => { expect(errors.get(info.testId)).toEqual([]); errors.delete(info.testId); });

test("SQL filters and sorting survive reload and reset the page", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/collections/all?sort=price-asc&page=2");
  const filter = page.getByRole("complementary", { name: "Bộ lọc sản phẩm" });
  await filter.getByRole("button", { name: "L", exact: true }).click();
  await expect(page).not.toHaveURL(/[?&]page=2/);
  await expect(filter.getByRole("button", { name: "L", exact: true })).toHaveAttribute("aria-pressed", "true");
  await filter.getByRole("button", { name: "Trắng", exact: true }).click();
  await expect(page).toHaveURL(/color=trang/);
  await filter.getByLabel("Dưới 200.000₫", { exact: true }).check();
  await expect(page).toHaveURL(/price=under-200/);
  await filter.getByLabel("Chỉ hiện sản phẩm còn hàng").check();
  await expect(page).toHaveURL(/instock=1/);
  await page.getByRole("combobox", { name: "Sắp xếp theo:" }).click();
  await page.getByRole("option", { name: "Giá: Giảm dần", exact: true }).click();
  await expect(page).toHaveURL(/sort=price-desc/);
  const url = page.url();
  await expect(page.getByTestId("product-card")).toHaveCount(2);
  await expect(page.getByTestId("product-card").first()).toContainText("Áo thun hai màu");
  await page.reload();
  await expect(page).toHaveURL(url);
  await expect(filter.getByRole("button", { name: "L", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(filter.getByRole("button", { name: "Trắng", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(filter.getByLabel("Dưới 200.000₫", { exact: true })).toBeChecked();
  await expect(filter.getByLabel("Chỉ hiện sản phẩm còn hàng")).toBeChecked();
  await expect(page.getByRole("combobox", { name: "Sắp xếp theo:" })).toContainText("Giá: Giảm dần");
  await filter.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await expect(page).not.toHaveURL(/size=|color=|price=|instock=/);
  await expect(page.getByTestId("product-card")).toHaveCount(12);
});

test("pagination, automatic/category/manual collections and invalid query values", async ({ page }) => {
  await page.goto("/collections/all?sort=price-asc");
  await expect(page.getByTestId("product-card")).toHaveCount(12);
  const first = await page.getByTestId("product-card").first().getAttribute("href");
  await page.getByRole("link", { name: "Trang 2", exact: true }).click();
  await expect(page).toHaveURL(/page=2#product-grid/);
  await expect(page.getByRole("link", { name: "Trang 2", exact: true })).toHaveAttribute("aria-current", "page");
  expect(await page.getByTestId("product-card").first().getAttribute("href")).not.toBe(first);
  expect(await page.locator("#product-grid").evaluate((node) => node.getBoundingClientRect().top)).toBeLessThan(200);
  await page.goto("/collections/all?size=INVALID&color=INVALID&price=no&sort=no&page=-1&instock=no");
  await expect(page.getByTestId("product-card")).toHaveCount(12);
  await expect(page.getByRole("combobox", { name: "Sắp xếp theo:" })).toContainText("Nổi bật");
  await page.goto("/collections/ao"); await expect(page.getByRole("navigation", { name: "Danh mục con" }).getByRole("link", { name: "Áo thun", exact: true })).toBeVisible();
  for (const slug of ["ao-thun", "sale", "new-arrival", "best-seller", "bo-suu-tap-thu"]) {
    const response = await page.goto(`/collections/${slug}`); expect(response?.status()).toBe(200); await expect(page.getByTestId("product-card").first()).toBeVisible();
  }
  await page.goto("/collections/nhom-rong");
  await expect(page.getByRole("heading", { name: "Không tìm thấy sản phẩm phù hợp" })).toBeVisible();
});

test("search accepts unaccented Vietnamese, paginates, and suggests best sellers when empty", async ({ page }) => {
  await page.goto("/search?q=ao%20thun%20hai%20mau");
  await expect(page.getByLabel("Từ khóa tìm kiếm")).toHaveValue("ao thun hai mau");
  await expect(page.getByTestId("product-card").filter({ hasText: "Áo thun hai màu" })).toBeVisible();
  await page.getByLabel("Từ khóa tìm kiếm").fill("ao thun"); await page.getByRole("button", { name: "Tìm sản phẩm" }).click();
  await expect(page.getByTestId("product-card")).toHaveCount(12);
  await page.getByRole("link", { name: "Trang 2", exact: true }).click();
  await expect(page).toHaveURL(/q=ao\+thun&page=2/);
  await page.getByLabel("Từ khóa tìm kiếm").fill("khong-co-san-pham-nay"); await page.getByRole("button", { name: "Tìm sản phẩm" }).click();
  await expect(page.getByRole("heading", { name: "Không tìm thấy sản phẩm nào", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "BEST SELLER", exact: true }).getByTestId("product-card")).toHaveCount(4);
  await page.getByRole("button", { name: "Mở tìm kiếm" }).click();
  await page.getByLabel("Tìm kiếm sản phẩm", { exact: true }).fill("ao thun"); await page.getByLabel("Tìm kiếm sản phẩm", { exact: true }).press("Enter");
  await expect(page).toHaveURL(/\/search\?q=ao%20thun$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

for (const width of [375, 768, 1280]) test(`listing, search and product at ${width}px`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/collections/all");
  await expect(page.getByTestId("product-card")).toHaveCount(12);
  await page.locator('[data-filters-ready="true"]').waitFor();
  await noOverflow(page); await page.screenshot({ path: `test-results/phase7-listing-${width}.png`, fullPage: true, caret: "initial" });
  if (width < 1024) {
    await page.getByRole("button", { name: "BỘ LỌC", exact: true }).click();
    const dialog = page.getByRole("dialog"); await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "L", exact: true }).click();
    await expect(dialog.getByRole("button", { name: "L", exact: true })).toHaveAttribute("aria-pressed", "true");
    await noOverflow(page); await page.screenshot({ path: `test-results/phase7-filter-${width}.png`, caret: "initial" });
    await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0);
    await page.getByRole("button", { name: /^BỘ LỌC/ }).click();
    await page.locator('[data-slot="sheet-overlay"]').click({ position: { x: width - 8, y: 400 }, force: true });
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await page.goto("/search?q=ao%20thun"); await noOverflow(page); await page.screenshot({ path: `test-results/phase7-search-${width}.png`, fullPage: true, caret: "initial" });
  await page.goto("/products/ao-thun-hai-mau");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Áo thun hai màu");
  const gallery = page.getByTestId("product-gallery"); await expect(gallery).toHaveAttribute("data-selected-image", "1");
  await expect(page.getByRole("button", { name: "Màu Đen", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "M", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("button", { name: "L", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Màu Xanh", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "M", exact: true }).click();
  await expect(page.getByText("SKU: DETAIL01-DEN-M", { exact: true })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Chỉ còn 2" })).toBeVisible();
  await page.getByRole("button", { name: "Tăng số lượng" }).click(); await expect(page.getByLabel("Số lượng", { exact: true })).toHaveValue("2");
  await expect(page.getByRole("button", { name: "Tăng số lượng" })).toBeDisabled();
  await page.getByLabel("Số lượng", { exact: true }).fill("99"); await expect(page.getByLabel("Số lượng", { exact: true })).toHaveValue("2");
  await page.getByRole("button", { name: "Màu Trắng", exact: true }).click();
  await expect(gallery).toHaveAttribute("data-selected-image", "2");
  await expect(gallery.getByRole("img", { name: "Áo thun màu trắng", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "M", exact: true })).toBeDisabled(); await expect(page.getByRole("button", { name: "XL", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "L", exact: true }).click();
  await expect(page.getByText("SKU: DETAIL01-TRANG-L", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Xem ảnh 1", exact: true }).click(); await expect(gallery).toHaveAttribute("data-selected-image", "0");
  if (width < 1024) {
    const photo = gallery.getByRole("group").first();
    await photo.scrollIntoViewIfNeeded();
    const box = (await photo.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.85, box.y + box.height / 2); await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.15, box.y + box.height / 2, { steps: 12 }); await page.mouse.up();
    await expect(gallery).toHaveAttribute("data-selected-image", "1");
  }
  await page.getByRole("button", { name: "Hướng dẫn chọn size", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("columnheader", { name: "Dài áo (cm)" })).toBeVisible();
  await noOverflow(page); await page.screenshot({ path: `test-results/phase7-size-${width}.png`, caret: "initial" });
  await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "CHẤT LIỆU & BẢO QUẢN", exact: true }).click(); await expect(page.getByText("Chất liệu: Cotton", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "BẢNG SIZE", exact: true }).click(); await expect(page.getByRole("table", { name: "Bảng size áo thun thử" })).toBeVisible();
  await page.getByRole("button", { name: "CHÍNH SÁCH ĐỔI TRẢ", exact: true }).click(); await expect(page.getByText("Đổi trả theo chính sách kiểm thử của shop.", { exact: true })).toBeVisible();
  await noOverflow(page); await page.evaluate(() => window.scrollTo(0, 0)); await expect(page.locator("[data-sticky-buy-bar]")).toHaveCount(0); await page.screenshot({ path: `test-results/phase7-product-${width}.png`, fullPage: true, caret: "initial" });
  const related = page.getByRole("region", { name: "SẢN PHẨM LIÊN QUAN", exact: true });
  await expect(related.getByTestId("product-card")).toHaveCount(4);
  await expect(related.locator('a[href="/products/ao-thun-hai-mau"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "MUA NGAY", exact: true })).toBeEnabled();
  if (width < 1024) {
    await page.getByRole("button", { name: "Màu Đen", exact: true }).click();
    await related.scrollIntoViewIfNeeded();
    await expect(page.locator("[data-sticky-buy-bar]")).toBeVisible();
    const floating = await page.getByRole("link", { name: "Liên hệ Zalo", exact: true }).boundingBox();
    const sticky = await page.locator("[data-sticky-buy-bar]").boundingBox();
    expect(floating!.y + floating!.height).toBeLessThan(sticky!.y);
    await page.locator("[data-sticky-buy-bar]").getByRole("button", { name: "THÊM VÀO GIỎ", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Vui lòng chọn màu sắc và kích thước" })).toHaveText("Vui lòng chọn màu sắc và kích thước");
    await expect(page.getByRole("button", { name: "M", exact: true })).toBeInViewport();
  }
});

test("hidden/missing products and collections return actual HTTP 404", async ({ page }) => {
  for (const pathname of ["/products/ao-thun-25", "/products/ao-thun-26", "/products/ao-trong-nhom-an", "/products/khong-ton-tai", "/collections/khong-ton-tai", "/collections/nhom-an", "/duong-dan-khong-ton-tai"]) {
    const response = await page.goto(pathname); expect(response?.status(), pathname).toBe(404);
    await expect(page.getByRole("heading", { name: "KHÔNG TÌM THẤY TRANG", exact: true })).toBeVisible();
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(1);
  }
});

test("all-sold-out products expose no selectable size or purchase action", async ({ page }) => {
  await page.goto("/products/ao-thun-24");
  await expect(page.getByRole("button", { name: "M", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "HẾT HÀNG", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "MUA NGAY", exact: true })).toHaveCount(0);
});

test("shop error boundary retries by fetching server content again", async ({ page, context }) => {
  await context.setExtraHTTPHeaders({ "x-phase7-error": "1", "x-phase7-fail": "1" });
  await page.goto("/phase7-error-probe");
  await expect(page.getByRole("heading", { name: "Đã có lỗi xảy ra", exact: true })).toBeVisible();
  const overlayClose = page.locator("nextjs-portal").getByRole("button", { name: /Close|Hide Errors/ });
  if (await overlayClose.count()) await overlayClose.first().click();
  await context.setExtraHTTPHeaders({ "x-phase7-error": "1", "x-phase7-fail": "0" });
  await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Đã khôi phục trang kiểm thử", exact: true })).toBeVisible();
});
