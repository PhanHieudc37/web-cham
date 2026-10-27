import { expect, test } from "@playwright/test";

for (const width of [375, 768, 1280]) {
  test(`preview layout and product selection at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./");
    await expect(page.getByRole("heading", { name: "Ít hơn. Nhưng là bạn." })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('600 20px "Be Vietnam Pro"'))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/preview-home-${width}.png`, fullPage: true });

    await page.locator('.product-image[href="#product/boxy-tee"]').click();
    const product = page.getByRole("dialog", { name: "Áo thun Boxy Essential" });
    await expect(product).toBeVisible();
    await product.getByRole("button", { name: "THÊM VÀO GIỎ MẪU" }).click();
    await expect(page.getByRole("alert")).toContainText("Vui lòng chọn kích thước");
    await product.getByRole("button", { name: "Màu Kem", exact: true }).click();
    await expect(page.locator("#detail-image")).toHaveAttribute("src", /cream\.svg$/);
    await product.getByRole("button", { name: "M", exact: true }).click();
    expect(await page.evaluate(() => document.querySelector("#product-dialog")!.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/preview-product-${width}.png`, fullPage: true });
    await product.getByRole("button", { name: "THÊM VÀO GIỎ MẪU" }).click();
    const cart = page.locator("#cart-dialog");
    await expect(cart).toBeVisible();
    await expect(cart).toContainText("Kem / M");
    await expect(page.locator("#cart-count")).toHaveText("1");
    await page.screenshot({ path: `test-results/preview-cart-${width}.png`, fullPage: true });
    await cart.getByRole("button", { name: /Xóa .*khỏi giỏ mẫu/ }).click();
    await expect(cart).toContainText("Giỏ mẫu của bạn đang trống");
    await page.keyboard.press("Escape");
    await expect(cart).not.toBeVisible();
    await expect(page.locator("body")).not.toHaveClass(/dialog-open/);
    expect(errors).toEqual([]);
  });
}

test("search without accents, filter, sort and deep link reload", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await page.getByRole("searchbox", { name: "Tên sản phẩm" }).fill("ao thun");
  await expect(page.locator(".search-item")).toHaveCount(2);
  await page.getByRole("searchbox").press("Enter");
  await expect(page.locator("#main .product-card")).toHaveCount(2);
  await page.goto("./#shop?category=bottoms&sort=price-asc");
  await expect(page.locator("#main .product-card")).toHaveCount(4);
  await expect(page.locator("#main .product-card").first()).toContainText("Quần short Weekend");
  await page.locator("#availability").check();
  await expect(page.locator("#main .product-card")).toHaveCount(3);
  await page.reload();
  await expect(page.locator("#availability")).toBeChecked();
  await expect(page.locator("#main .product-card")).toHaveCount(3);
  await page.goto("./#shop?q=zzzz");
  await expect(page.getByRole("heading", { name: "Không tìm thấy sản phẩm phù hợp" })).toBeVisible();
});

test("mobile menu, outside click, dialog focus and safe query rendering", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("./");
  await page.getByRole("button", { name: "Mở menu" }).click();
  await expect(page.locator("#menu-dialog")).toBeVisible();
  await page.mouse.click(365, 400);
  await expect(page.locator("#menu-dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Mở menu" }).click();
  await page.locator("#menu-dialog").getByRole("link", { name: "Áo ↗", exact: true }).click();
  await expect(page.locator("#main .product-card")).toHaveCount(6);
  await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await expect(page.getByRole("searchbox")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Tìm kiếm", exact: true })).toBeFocused();
  await page.goto(`./#shop?q=${encodeURIComponent('<img src=x onerror="alert(1)">')}`);
  await expect(page.locator(".listing-title h1")).toContainText('<img src=x onerror="alert(1)">');
  await expect(page.locator(".listing-title img")).toHaveCount(0);
});

test("all images load locally, no external requests or personal-data forms", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("./#shop");
  await expect(page.locator(".product-card")).toHaveCount(12);
  await page.locator(".footer").scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator("img").evaluateAll((images) => images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBe(true);
  const origin = new URL(page.url()).origin;
  expect(requests.every((url) => new URL(url).origin === origin)).toBe(true);
  expect(await page.locator('input[type="email"],input[type="password"],form').count()).toBe(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
});
