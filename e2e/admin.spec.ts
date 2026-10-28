import { expect, test, type Page } from "@playwright/test";

const password = "E2e-private-password-12345";
const browserErrors = new Map<string, string[]>();
async function login(page: Page, role = "admin", customPassword = password) {
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(`${role}@example.test`);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(customPassword);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
}
async function checkWidth(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth)); }
test.beforeEach(async ({ context, page }, info) => {
  await context.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${info.testId.split("").reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % 200 + 1}` });
  const errors: string[] = []; browserErrors.set(info.testId, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error" && /hydrat|didn't match/i.test(message.text())) errors.push(message.text()); });
});
test.afterEach(async ({ page }, info) => { page.removeAllListeners("pageerror"); page.removeAllListeners("console"); expect(browserErrors.get(info.testId) ?? []).toEqual([]); browserErrors.delete(info.testId); });

test("anonymous redirects, noindex and blocked raw authentication mutations", async ({ page, request }) => {
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fusers/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  for (const path of ["sign-up/email", "admin/create-user", "admin/set-role", "admin/ban-user", "admin/remove-user", "update-user"]) {
    const response = await request.post(`/api/auth/${path}`, { data: {} });
    expect(response.status()).toBe(403); expect(await response.json()).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
  }
});
test("generic login failure, safe return path, session cookie and logout", async ({ page, context }) => {
  await page.goto("/admin/login?next=//example.test");
  await page.getByLabel("Email", { exact: true }).fill("admin@example.test"); await page.getByLabel("Mật khẩu", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Email hoặc mật khẩu không đúng" })).toBeVisible();
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password); await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const cookie = (await context.cookies()).find((entry) => entry.name.includes("session_token")); expect(cookie?.httpOnly).toBe(true); expect(cookie?.sameSite).toBe("Lax");
  await page.goto("/admin/login"); await expect(page).toHaveURL(/\/admin$/);
  await page.getByRole("button", { name: "Menu tài khoản" }).click(); await page.getByRole("menuitem", { name: "Đăng xuất", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin/users"); await expect(page).toHaveURL(/\/admin\/login/);
});
test("staff cannot see restricted links or access settings/accounts via URL", async ({ page }) => {
  await login(page, "staff");
  await expect(page.getByRole("link", { name: "Tài khoản", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Cài đặt", exact: true })).toHaveCount(0);
  for (const path of ["/admin/users", "/admin/settings"]) {
    await page.goto(path); await expect(page).toHaveURL(/\/admin\/forbidden$/);
    await expect(page.getByRole("heading", { name: "Bạn không có quyền truy cập" })).toBeVisible();
  }
});
test("login returns to a protected admin URL with its query", async ({ page }) => {
  await page.goto("/admin/users?q=admin");
  await page.getByLabel("Email", { exact: true }).fill("admin@example.test");
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/users\?q=admin$/);
  await expect(page.getByLabel("Tìm tài khoản")).toHaveValue("admin");
});
for (const width of [375, 768, 1280]) test(`admin pages and mobile navigation at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/admin/login"); await expect(page.getByLabel("Email", { exact: true })).toBeEnabled(); await checkWidth(page); await page.screenshot({ path: `test-results/admin-login-${width}.png`, fullPage: true });
  await login(page); await checkWidth(page);
  await page.screenshot({ path: `test-results/admin-home-${width}.png`, fullPage: true });
  if (width < 1024) {
    await page.getByRole("button", { name: "Mở menu quản trị" }).click(); await expect(page.getByRole("dialog", { name: "Menu quản trị" })).toBeVisible();
    await page.keyboard.press("Escape"); await expect(page.getByRole("dialog", { name: "Menu quản trị" })).not.toBeVisible();
    await page.getByRole("button", { name: "Mở menu quản trị" }).click(); await page.mouse.click(width - 10, 500); await expect(page.getByRole("dialog", { name: "Menu quản trị" })).not.toBeVisible();
    await page.getByRole("button", { name: "Mở menu quản trị" }).click(); await page.getByRole("dialog").getByRole("link", { name: "Tài khoản", exact: true }).click();
  } else await page.getByRole("link", { name: "Tài khoản", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Tài khoản quản trị/ })).toBeVisible(); await checkWidth(page);
  await page.screenshot({ path: `test-results/admin-users-${width}.png`, fullPage: true });
  await page.getByRole("button", { name: "Thêm tài khoản", exact: true }).click(); await checkWidth(page);
  await page.screenshot({ path: `test-results/admin-create-${width}.png`, fullPage: true });
  await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("admin creates, searches, changes roles, locks and resets a staff account", async ({ page }) => {
  await login(page); await page.goto("/admin/users");
  await page.getByRole("button", { name: "Thêm tài khoản", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Họ và tên").fill("Thành viên mới");
  page.once("dialog", (prompt) => prompt.dismiss()); await page.keyboard.press("Escape"); await expect(dialog).toBeVisible();
  await dialog.getByLabel("Email", { exact: true }).fill("member@example.test"); await dialog.getByLabel("Mật khẩu tạm", { exact: true }).fill(password);
  await dialog.getByRole("button", { name: "Thêm tài khoản", exact: true }).click(); await expect(dialog).not.toBeVisible();
  await page.getByLabel("Tìm tài khoản").fill("member@"); await page.getByRole("button", { name: "Tìm", exact: true }).click();
  await expect(page).toHaveURL(/q=member/); await expect(page.getByText("Thành viên mới", { exact: true }).filter({ visible: true })).toBeVisible();
  await page.getByRole("button", { name: "Đổi vai trò Thành viên mới" }).filter({ visible: true }).click();
  await dialog.getByRole("button", { name: "Xác nhận" }).click(); await expect(dialog).not.toBeVisible();
  await expect(page.getByText("Quản trị viên", { exact: true }).filter({ visible: true }).last()).toBeVisible();
  await page.getByRole("button", { name: "Khóa Thành viên mới", exact: true }).filter({ visible: true }).click(); await dialog.getByRole("button", { name: "Xác nhận" }).click(); await expect(dialog).not.toBeVisible();
  await expect(page.getByText("Đã khóa", { exact: true }).filter({ visible: true })).toBeVisible();
  await page.getByRole("button", { name: "Mở khóa Thành viên mới", exact: true }).filter({ visible: true }).click(); await dialog.getByRole("button", { name: "Xác nhận" }).click(); await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Đặt lại mật khẩu Thành viên mới" }).filter({ visible: true }).click(); await dialog.getByLabel("Mật khẩu tạm mới").fill("Member-new-password-12345"); await dialog.getByRole("button", { name: "Đặt lại mật khẩu", exact: true }).click(); await expect(dialog).not.toBeVisible();
});
test("self password form validates old password and saves a new password", async ({ page }) => {
  await login(page, "staff"); await page.getByRole("button", { name: "Menu tài khoản" }).click(); await page.getByRole("menuitem", { name: "Đổi mật khẩu" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Mật khẩu hiện tại", { exact: true }).fill("wrong-password"); await dialog.getByLabel("Mật khẩu mới", { exact: true }).fill("Staff-new-password-12345"); await dialog.getByLabel("Nhập lại mật khẩu mới", { exact: true }).fill("Staff-new-password-12345");
  await dialog.getByRole("button", { name: "Lưu mật khẩu" }).click(); await expect(dialog.getByRole("alert")).toHaveText("Mật khẩu hiện tại không đúng.");
  await dialog.getByLabel("Mật khẩu hiện tại", { exact: true }).fill(password); await dialog.getByRole("button", { name: "Lưu mật khẩu" }).click(); await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Menu tài khoản" }).click(); await page.getByRole("menuitem", { name: "Đăng xuất", exact: true }).click(); await expect(page).toHaveURL(/\/admin\/login$/);
  await login(page, "staff", "Staff-new-password-12345");
});
