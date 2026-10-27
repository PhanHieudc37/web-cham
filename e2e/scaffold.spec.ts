import { expect, test } from "@playwright/test";

for (const width of [375, 768, 1280]) {
  test(`home page at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Cham.stu", exact: true })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "vi");
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.evaluate(() => {
      const heading = document.querySelector("h1");
      if (!heading) throw new Error("Missing heading");
      const style = getComputedStyle(heading);
      const family = style.fontFamily.split(",")[0].trim().replaceAll('"', "");
      return {
        width: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        family,
        fontLoaded: document.fonts.check(`${style.fontWeight} ${style.fontSize} "${family}"`),
        loadedFaces: Array.from(document.fonts).filter((font) => font.status === "loaded").length,
      };
    });
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
    expect(layout.family.toLowerCase()).toContain("be vietnam pro");
    expect(layout.fontLoaded).toBe(true);
    expect(layout.loadedFaces).toBeGreaterThan(0);
    expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response?.headers()["x-frame-options"]).toBe("DENY");
    expect(response?.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(response?.headers()["permissions-policy"]).toBe("camera=(), microphone=(), geolocation=()");
    await page.screenshot({ path: `test-results/home-${width}.png`, fullPage: true });
  });
}
