import "server-only";
import { afterEach, expect, it, vi } from "vitest";
import { defaultSettings } from "@/lib/validation/settings";
vi.mock("./settings.service", () => ({ getPublicSettings: async () => ({ ...defaultSettings, shop: { ...defaultSettings.shop, name: "Cham.stu" }, seo: { defaultTitle: "Cham.stu", defaultDescription: "Mô tả mặc định", ogImageUrl: "https://images.example.test/og.png" } }) }));
import { getPageMetadata } from "./seo.service";
afterEach(() => vi.unstubAllEnvs());
it("generates canonical URLs without filters and configurable social images, while retaining noindex", async () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://shop.example.test");
  const metadata = await getPageMetadata({ title: "Áo", description: "Mô tả áo", path: "/collections/ao?page=3&size=M" });
  expect(metadata).toMatchObject({ title: "Áo | Cham.stu", description: "Mô tả áo", alternates: { canonical: "https://shop.example.test/collections/ao" }, openGraph: { url: "https://shop.example.test/collections/ao", images: [{ url: "https://images.example.test/og.png" }] } });
  expect(await getPageMetadata({ title: "Tra cứu | Cham.stu", path: "/kiem-tra-don-hang", noindex: true })).toMatchObject({ title: "Tra cứu | Cham.stu", robots: { index: false, follow: false } });
});
